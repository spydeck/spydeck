import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { eq, count } from 'drizzle-orm';
import sharp from 'sharp';
import convert from 'heic-convert';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';
import { SyncService } from './sync.service';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { posts } from '../db/schema';
import { normalizeHandle, youtubeProfileParams } from './social-handle';

// ponytail: facebook has no ScrapeCreators post endpoint; reject explicitly.
type SupportedPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x';

const EXTRACTABLE: SupportedPlatform[] = [
  'instagram',
  'tiktok',
  'youtube',
  'x',
];

const DEFAULT_POST_COUNT = 9;

export interface SyncPostsPayload {
  authorId: string;
}

type PostRow = {
  authorId: string;
  platform: SupportedPlatform;
  text: string;
  mediaUrl: string | null;
  videoUrl: string | null;
  postUrl: string | null;
  date: Date;
  likes: number;
  views: number;
  shares: number;
  comments: number;
  status: 'draft';
};

// X/Twitter media carries multiple encodings; pick the highest-bitrate mp4.
function pickTwitterVideo(media: any): string | null {
  const variants = (media?.video_info?.variants ?? []) as any[];
  const mp4s = variants
    .filter((v) => v?.content_type === 'video/mp4' && v?.url)
    .sort((a, b) => Number(b?.bitrate ?? 0) - Number(a?.bitrate ?? 0));
  return (mp4s[0]?.url as string | undefined) ?? null;
}

// ── Per-platform raw response mappers ────────────────────────────────────────

// TikTok /v3/tiktok/profile/videos
// Response: { aweme_list: Array<{ desc, create_time, statistics: { digg_count, comment_count, play_count, share_count }, video: { cover: { url_list: string[] } } }> }
function mapTiktokPosts(authorId: string, raw: unknown): PostRow[] {
  const list = ((raw as any)?.aweme_list ?? []) as any[];
  return list.map((item) => ({
    authorId,
    platform: 'tiktok' as const,
    text: String(item?.desc ?? ''),
    mediaUrl: (item?.video?.cover?.url_list?.[0] as string | undefined) ?? null,
    videoUrl:
      (item?.video?.play_addr?.url_list?.[0] as string | undefined) ??
      (item?.video?.download_addr?.url_list?.[0] as string | undefined) ??
      null,
    postUrl: (item?.share_url as string | undefined) ?? null,
    date: new Date((Number(item?.create_time) || 0) * 1000),
    likes: Number(item?.statistics?.digg_count ?? 0),
    comments: Number(item?.statistics?.comment_count ?? 0),
    views: Number(item?.statistics?.play_count ?? 0),
    shares: Number(item?.statistics?.share_count ?? 0),
    status: 'draft' as const,
  }));
}

// Instagram /v2/instagram/user/posts
// Response: { items: Array<{ caption: { text } | null, taken_at, image_versions2: { candidates: [{ url }] }, display_uri, like_count, comment_count }> }
function mapInstagramPosts(authorId: string, raw: unknown): PostRow[] {
  const items = ((raw as any)?.items as any[]) ?? [];
  return items.map((item) => {
    const caption: string =
      typeof item?.caption === 'object' && item?.caption !== null
        ? (item.caption.text ?? '')
        : '';
    return {
      authorId,
      platform: 'instagram' as const,
      text: String(caption),
      mediaUrl:
        (item?.image_versions2?.candidates?.[0]?.url as string | undefined) ??
        (item?.display_uri as string | undefined) ??
        null,
      videoUrl: (item?.video_versions?.[0]?.url as string | undefined) ?? null,
      postUrl: item?.code
        ? `https://www.instagram.com/p/${String(item.code)}/`
        : null,
      date: new Date((Number(item?.taken_at) || 0) * 1000),
      likes: Number(item?.like_count ?? 0),
      comments: Number(item?.comment_count ?? 0),
      views: Number(item?.view_count ?? item?.play_count ?? 0),
      shares: 0,
      status: 'draft' as const,
    };
  });
}

// YouTube /v1/youtube/channel-videos
// Response: { videos: Array<{ title, thumbnail, publishDate, publishedTime, viewCountInt, likeCountInt, commentCountInt }> }
function mapYoutubePosts(authorId: string, raw: unknown): PostRow[] {
  const items = ((raw as any)?.videos ?? []) as any[];
  return items.map((item) => ({
    authorId,
    platform: 'youtube' as const,
    text: String(item?.title ?? ''),
    mediaUrl: (item?.thumbnail as string | undefined) ?? null,
    // ponytail: YouTube gives no direct stream URL; link the watch page instead.
    videoUrl: null,
    postUrl:
      (item?.url as string | undefined) ??
      (item?.id || item?.videoId
        ? `https://www.youtube.com/watch?v=${String(item?.id ?? item?.videoId)}`
        : null),
    date: item?.publishDate
      ? new Date(item.publishDate as string)
      : item?.publishedTime
        ? new Date(item.publishedTime as string)
        : new Date(0),
    likes: Number(item?.likeCountInt ?? 0),
    comments: Number(item?.commentCountInt ?? 0),
    views: Number(item?.viewCountInt ?? 0),
    shares: 0,
    status: 'draft' as const,
  }));
}

// Twitter/X /v1/twitter/user-tweets
// Response: { tweets: Array<{ legacy: { full_text, created_at, favorite_count, reply_count, retweet_count, entities: { media } }, views: { count } }> }
function mapTwitterPosts(authorId: string, raw: unknown): PostRow[] {
  const tweets: any[] = (raw as any)?.tweets ?? [];
  const rows: PostRow[] = [];
  for (const tweet of tweets) {
    const legacy = tweet?.legacy ?? {};
    if (!legacy?.full_text) continue;
    rows.push({
      authorId,
      platform: 'x' as const,
      text: String(legacy.full_text ?? ''),
      mediaUrl:
        (legacy?.entities?.media?.[0]?.media_url_https as string | undefined) ??
        null,
      videoUrl: pickTwitterVideo(
        legacy?.extended_entities?.media?.[0] ?? legacy?.entities?.media?.[0],
      ),
      postUrl: legacy?.id_str
        ? `https://x.com/i/status/${String(legacy.id_str)}`
        : null,
      date: legacy?.created_at
        ? new Date(legacy.created_at as string)
        : new Date(0),
      likes: Number(legacy?.favorite_count ?? 0),
      comments: Number(legacy?.reply_count ?? 0),
      views: Number(tweet?.views?.count ?? 0),
      shares: Number(legacy?.retweet_count ?? 0),
      status: 'draft' as const,
    });
  }
  return rows;
}

function mapPosts(
  platform: SupportedPlatform,
  authorId: string,
  raw: unknown,
): PostRow[] {
  switch (platform) {
    case 'tiktok':
      return mapTiktokPosts(authorId, raw);
    case 'instagram':
      return mapInstagramPosts(authorId, raw);
    case 'youtube':
      return mapYoutubePosts(authorId, raw);
    case 'x':
      return mapTwitterPosts(authorId, raw);
  }
}

// ponytail: only HEIC is embedded to keep payload sizes manageable;
// other formats stay as remote URLs. Move to object storage if rows grow too large.
const MAX_HEIC_BYTES = 5 * 1024 * 1024; // 5 MB guard

function isHeic(url: string): boolean {
  return /\.hei[cf](\?|$)/i.test(url);
}

// ── Processor ────────────────────────────────────────────────────────────────

@Injectable()
@Processor('sync-posts')
export class SyncPostsProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncPostsProcessor.name);

  constructor(
    private readonly authors: AuthorsService,
    private readonly scrapeCreators: ScrapeCreatorsService,
    private readonly sync: SyncService,
    @Inject(DB) private readonly db: DrizzleDB,
  ) {
    super();
  }

  async process(job: Job<SyncPostsPayload>): Promise<unknown> {
    const { authorId } = job.data;
    this.logger.log(`sync-posts started for author ${authorId}`);

    try {
      const author = await this.authors.findOne(authorId);
      const socials = (author.socials ?? {}) as Record<
        string,
        { value: string; synchronize: boolean }
      >;

      // First-time check: skip if author already has posts in the DB.
      // ponytail: re-syncing safely requires a stored external post ID for dedup.
      // The posts table has no such column yet — add it and handle here when needed.
      const [{ count: existingCount }] = await this.db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.authorId, authorId));

      if (Number(existingCount) > 0) {
        this.logger.log(
          `author ${authorId} already has ${existingCount} post(s) — skipping (TODO: incremental sync)`,
        );
        return { skipped: true, reason: 'already_synced' };
      }

      for (const platform of EXTRACTABLE) {
        const social = socials[platform];
        if (!social?.value?.trim()) continue;

        const cfg = await this.sync.getSyncConfig(authorId, platform);
        const scope = cfg
          ? {
              mode: cfg.mode,
              count: cfg.postCount,
              from: cfg.fromDate,
              to: cfg.toDate,
            }
          : { mode: 'count' as const, count: DEFAULT_POST_COUNT };

        let raw: unknown;
        try {
          raw = await this.fetchPosts(platform, social.value);
        } catch (err) {
          this.logger.warn(
            `failed to fetch ${platform} posts for author ${authorId}: ${(err as Error).message}`,
          );
          continue;
        }

        let mapped = mapPosts(platform, authorId, raw);

        // Apply scope filter
        if (scope.mode === 'count') {
          const n = scope.count ?? DEFAULT_POST_COUNT;
          mapped = mapped.slice(0, n);
        } else if (scope.mode === 'range' && scope.from && scope.to) {
          const from = new Date(scope.from);
          const to = new Date(scope.to);
          mapped = mapped.filter((p) => p.date >= from && p.date <= to);
        }
        // ponytail: 'full' mode takes the page as returned; pagination is a TODO.
        // One page per platform per job. Implement cursor-based pagination when needed.

        if (mapped.length === 0) {
          this.logger.log(
            `no ${platform} posts to insert for author ${authorId}`,
          );
          continue;
        }

        // Transcode HEIC covers to base64 JPEG so browsers can render them.
        let heicEmbedded = 0;
        for (const row of mapped) {
          if (row.mediaUrl && isHeic(row.mediaUrl)) {
            const embedded = await this.embedHeicCover(row.mediaUrl, platform);
            if (embedded) {
              row.mediaUrl = embedded;
              heicEmbedded++;
            }
          }
        }
        if (heicEmbedded > 0) {
          this.logger.log(
            `embedded ${heicEmbedded} HEIC cover(s) for ${platform} / author ${authorId}`,
          );
        }

        await this.db.insert(posts).values(mapped);
        this.logger.log(
          `inserted ${mapped.length} ${platform} post(s) for author ${authorId}`,
        );
      }

      return { ok: true };
    } catch (err) {
      this.logger.error(
        `sync-posts failed for author ${authorId}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  private async embedHeicCover(
    url: string,
    platform: string,
  ): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const contentLength = Number(res.headers.get('content-length') ?? 0);
      if (contentLength > MAX_HEIC_BYTES) {
        this.logger.warn(
          `HEIC cover too large (${contentLength} bytes) for ${platform}: ${url}`,
        );
        return null;
      }
      const input = Buffer.from(await res.arrayBuffer());
      if (input.byteLength > MAX_HEIC_BYTES) return null; // guard if header was absent
      // heic-convert bundles libde265 (WASM) which handles HEVC-encoded HEIC;
      // sharp's prebuilt libheif does NOT include the HEVC decoder.
      const jpegRaw = await convert({
        buffer: input,
        format: 'JPEG',
        quality: 0.8,
      });
      const jpeg = await sharp(Buffer.from(jpegRaw))
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 72 })
        .toBuffer();
      return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    } catch (err) {
      this.logger.warn(
        `failed to transcode HEIC cover for ${platform}: ${url} — ${(err as Error).message}`,
      );
      return null;
    }
  }

  private fetchPosts(
    platform: SupportedPlatform,
    value: string,
  ): Promise<unknown> {
    switch (platform) {
      case 'instagram':
        return this.scrapeCreators.instagramPosts({
          handle: normalizeHandle(value),
        });
      case 'tiktok':
        return this.scrapeCreators.tiktokProfileVideos({
          handle: normalizeHandle(value),
        });
      case 'youtube':
        return this.scrapeCreators.youtubeChannelVideos(
          youtubeProfileParams(value),
        );
      case 'x':
        return this.scrapeCreators.twitterTweets({
          handle: normalizeHandle(value),
        });
    }
  }
}
