import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { eq, count } from 'drizzle-orm';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';
import { SyncService } from './sync.service';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { posts } from '../db/schema';
import { normalizeHandle, youtubeProfileParams } from './social-handle';

// ponytail: facebook has no ScrapeCreators post endpoint; reject explicitly.
type SupportedPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x';

const EXTRACTABLE: SupportedPlatform[] = ['instagram', 'tiktok', 'youtube', 'x'];

const DEFAULT_POST_COUNT = 9;

export interface SyncPostsPayload {
  authorId: string;
}

type PostRow = {
  authorId: string;
  platform: SupportedPlatform;
  text: string;
  mediaUrl: string | null;
  date: Date;
  engagement: { likes: number; comments: number; views: number; shares: number };
  status: 'draft';
};

// ── Per-platform raw response mappers ────────────────────────────────────────

// TikTok /v3/tiktok/profile/videos
// Response: { itemList: Array<{ desc, createTime, stats: { diggCount, commentCount, playCount, shareCount }, video: { cover } }> }
function mapTiktokPosts(authorId: string, raw: unknown): PostRow[] {
  const list = ((raw as any)?.itemList ?? []) as any[];
  return list.map((item) => ({
    authorId,
    platform: 'tiktok' as const,
    text: String(item?.desc ?? ''),
    mediaUrl: (item?.video?.cover as string | undefined) ?? null,
    date: new Date((Number(item?.createTime) || 0) * 1000),
    engagement: {
      likes: Number(item?.stats?.diggCount ?? 0),
      comments: Number(item?.stats?.commentCount ?? 0),
      views: Number(item?.stats?.playCount ?? 0),
      shares: Number(item?.stats?.shareCount ?? 0),
    },
    status: 'draft' as const,
  }));
}

// Instagram /v2/instagram/user/posts
// Response: { data: { user: { edge_owner_to_timeline_media: { edges: Array<{ node: { edge_media_to_caption: { edges: [{node: {text}}] }, taken_at_timestamp, thumbnail_src, edge_liked_by: {count}, edge_media_to_comment: {count}, video_view_count } }> } } } }
function mapInstagramPosts(authorId: string, raw: unknown): PostRow[] {
  const edges =
    ((raw as any)?.data?.user?.edge_owner_to_timeline_media?.edges as any[]) ??
    [];
  return edges.map((e) => {
    const node = e?.node ?? {};
    const caption: string =
      node?.edge_media_to_caption?.edges?.[0]?.node?.text ?? '';
    return {
      authorId,
      platform: 'instagram' as const,
      text: String(caption),
      mediaUrl:
        (node?.thumbnail_src as string | undefined) ??
        (node?.display_url as string | undefined) ??
        null,
      date: new Date((Number(node?.taken_at_timestamp) || 0) * 1000),
      engagement: {
        likes: Number(node?.edge_liked_by?.count ?? 0),
        comments: Number(node?.edge_media_to_comment?.count ?? 0),
        views: Number(node?.video_view_count ?? 0),
        shares: 0,
      },
      status: 'draft' as const,
    };
  });
}

// YouTube /v1/youtube/channel-videos
// Response: { items: Array<{ snippet: { title, description, publishedAt, thumbnails: { default: { url } } }, statistics: { viewCount, likeCount, commentCount } }> }
function mapYoutubePosts(authorId: string, raw: unknown): PostRow[] {
  const items = ((raw as any)?.items ?? []) as any[];
  return items.map((item) => {
    const snippet = item?.snippet ?? {};
    const stats = item?.statistics ?? {};
    return {
      authorId,
      platform: 'youtube' as const,
      text: String(snippet?.title ?? snippet?.description ?? ''),
      mediaUrl:
        (snippet?.thumbnails?.maxres?.url as string | undefined) ??
        (snippet?.thumbnails?.high?.url as string | undefined) ??
        (snippet?.thumbnails?.default?.url as string | undefined) ??
        null,
      date: snippet?.publishedAt
        ? new Date(snippet.publishedAt as string)
        : new Date(0),
      engagement: {
        likes: Number(stats?.likeCount ?? 0),
        comments: Number(stats?.commentCount ?? 0),
        views: Number(stats?.viewCount ?? 0),
        shares: 0,
      },
      status: 'draft' as const,
    };
  });
}

// Twitter/X /v1/twitter/user-tweets
// Response: { data: { timeline_v2: { timeline: { instructions: Array<{ entries: Array<{ content: { itemContent: { tweet_results: { result: { legacy: { full_text, created_at, favorite_count, reply_count, retweet_count, views: { count } } } } } }> }> } } } }
function mapTwitterPosts(authorId: string, raw: unknown): PostRow[] {
  const instructions: any[] =
    (raw as any)?.data?.timeline_v2?.timeline?.instructions ?? [];
  const entries: any[] = instructions.flatMap((i: any) => i?.entries ?? []);
  const rows: PostRow[] = [];
  for (const entry of entries) {
    const result =
      entry?.content?.itemContent?.tweet_results?.result;
    if (!result) continue;
    const legacy = result?.legacy ?? result?.tweet?.legacy ?? {};
    if (!legacy?.full_text) continue;
    rows.push({
      authorId,
      platform: 'x' as const,
      text: String(legacy.full_text ?? ''),
      mediaUrl:
        (legacy?.entities?.media?.[0]?.media_url_https as string | undefined) ??
        null,
      date: legacy?.created_at ? new Date(legacy.created_at as string) : new Date(0),
      engagement: {
        likes: Number(legacy?.favorite_count ?? 0),
        comments: Number(legacy?.reply_count ?? 0),
        views: Number(result?.views?.count ?? legacy?.views?.count ?? 0),
        shares: Number(legacy?.retweet_count ?? 0),
      },
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
          ? { mode: cfg.mode, count: cfg.postCount, from: cfg.fromDate, to: cfg.toDate }
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
          this.logger.log(`no ${platform} posts to insert for author ${authorId}`);
          continue;
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

  private fetchPosts(platform: SupportedPlatform, value: string): Promise<unknown> {
    switch (platform) {
      case 'instagram':
        return this.scrapeCreators.instagramPosts({ handle: normalizeHandle(value) });
      case 'tiktok':
        return this.scrapeCreators.tiktokProfileVideos({ handle: normalizeHandle(value) });
      case 'youtube':
        return this.scrapeCreators.youtubeChannelVideos(youtubeProfileParams(value));
      case 'x':
        return this.scrapeCreators.twitterTweets({ handle: normalizeHandle(value) });
    }
  }
}
