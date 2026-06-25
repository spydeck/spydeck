import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { eq } from 'drizzle-orm';
import { authorsProfiles, authorsProfileLinks, type NewAuthorProfile, type NewAuthorProfileLink } from '../db/schema';

// Platforms with a matching ScrapeCreators profile endpoint.
// ponytail: facebook has no ScrapeCreators profile route; reject explicitly.
type SupportedPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x';

const SUPPORTED: SupportedPlatform[] = ['instagram', 'tiktok', 'youtube', 'x'];

export interface ProfileExtractPayload {
  authorId: string;
  // ponytail: platform optional — if omitted, first social with synchronize:true is used.
  platform?: SupportedPlatform;
}

@Processor('profile-extract')
export class ProfileExtractProcessor extends WorkerHost {
  private readonly logger = new Logger(ProfileExtractProcessor.name);

  constructor(
    private readonly authors: AuthorsService,
    private readonly scrapeCreators: ScrapeCreatorsService,
    @Inject(DB) private readonly db: DrizzleDB,
  ) {
    super();
  }

  async process(job: Job<ProfileExtractPayload>): Promise<unknown> {
    const { authorId, platform } = job.data;
    this.logger.log(`extracting profile for author ${authorId} (job ${job.id})`);

    const author = await this.authors.findOne(authorId);
    const socials = author.socials ?? {};
    const entries = Object.entries(socials) as [string, { value: string; synchronize: boolean } | undefined][];

    const chosen =
      this.pickPlatform(entries, platform) ??
      (entries.find(([, v]) => v?.synchronize && v.value) ?? entries.find(([, v]) => v?.value))?.[0];

    if (!chosen) {
      throw new NotFoundException(`Author ${authorId} has no social handle to extract`);
    }
    if (!SUPPORTED.includes(chosen as SupportedPlatform)) {
      throw new Error(`Unsupported platform '${chosen}' for profile extraction`);
    }

    const handle = socials[chosen as SupportedPlatform]?.value;
    if (!handle) {
      throw new NotFoundException(`Author ${authorId} has no handle for platform ${chosen}`);
    }

    const raw = await this.fetchProfile(chosen as SupportedPlatform, handle);
    this.logger.log(`profile fetched for ${author.name} @ ${chosen}/${handle}`);

    const { profileData, links } = this.mapProfile(chosen as SupportedPlatform, handle, raw);

    // Upsert core profile row; cascade-delete on the profile will clean up old links.
    const [upserted] = await this.db
      .insert(authorsProfiles)
      .values({ authorId, platform: chosen as SupportedPlatform, ...profileData })
      .onConflictDoUpdate({
        target: [authorsProfiles.authorId, authorsProfiles.platform],
        set: { ...profileData, updatedAt: new Date() },
      })
      .returning({ id: authorsProfiles.id });

    // Replace links: delete existing then insert fresh (simpler than diffing).
    if (links.length > 0) {
      await this.db.delete(authorsProfileLinks).where(
        eq(authorsProfileLinks.profileId, upserted.id),
      );
      const linkRows: NewAuthorProfileLink[] = links.map((l, i) => ({
        profileId: upserted.id,
        url: l.url,
        title: l.title ?? null,
        sortOrder: i,
      }));
      await this.db.insert(authorsProfileLinks).values(linkRows);
    }

    return { authorId, platform: chosen, handle, profileData };
  }

  /** Maps raw API response to normalized columns + extracted links. */
  private mapProfile(
    platform: SupportedPlatform,
    handle: string,
    raw: unknown,
  ): { profileData: Omit<NewAuthorProfile, 'authorId' | 'platform'>; links: { url: string; title?: string }[] } {
    const base: Omit<NewAuthorProfile, 'authorId' | 'platform'> = { handle, raw };

    switch (platform) {
      case 'tiktok': {
        // Response shape: { user: {...}, stats: {...} }
        const r = raw as { user: Record<string, unknown>; stats: Record<string, unknown> };
        const u = r?.user ?? {};
        const s = r?.stats ?? {};
        return {
          profileData: {
            ...base,
            platformId: String(u['id'] ?? ''),
            displayName: (u['nickname'] as string) ?? null,
            avatarUrl: (u['avatarLarger'] as string) ?? null,
            bio: (u['signature'] as string) ?? null,
            externalUrl: (u['bioLink'] as { link?: string } | undefined)?.link ?? null,
            verified: (u['verified'] as boolean) ?? null,
            followerCount: (s['followerCount'] as number) ?? null,
            followingCount: (s['followingCount'] as number) ?? null,
            tiktokLikeCount: (s['heart'] as number) ?? null,
            tiktokVideoCount: (s['videoCount'] as number) ?? null,
          },
          links: [],
        };
      }

      case 'instagram': {
        // Response shape: { success: true, data: { user: {...} } }
        const r = raw as { data?: { user?: Record<string, unknown> } };
        const u = (r?.data?.user ?? {}) as Record<string, unknown>;
        const bioLinks = (u['bio_links'] as Array<{ url?: string; title?: string }> | undefined) ?? [];
        return {
          profileData: {
            ...base,
            platformId: (u['id'] as string) ?? null,
            displayName: (u['full_name'] as string) ?? null,
            avatarUrl: (u['profile_pic_url'] as string) ?? null,
            bio: (u['biography'] as string) ?? null,
            externalUrl: (u['external_url'] as string) ?? null,
            verified: (u['is_verified'] as boolean) ?? null,
            followerCount: ((u['edge_followed_by'] as { count?: number } | undefined)?.count) ?? null,
            followingCount: ((u['edge_follow'] as { count?: number } | undefined)?.count) ?? null,
            igIsPrivate: (u['is_private'] as boolean) ?? null,
            igIsBusinessAccount: (u['is_business_account'] as boolean) ?? null,
            igCategoryName: (u['category_name'] as string) ?? null,
          },
          links: bioLinks.map((l) => ({ url: l.url ?? '', title: l.title })).filter((l) => l.url),
        };
      }

      case 'youtube': {
        // Response shape: flat object
        const u = (raw ?? {}) as Record<string, unknown>;
        const ytLinks = (u['links'] as string[] | undefined) ?? [];
        return {
          profileData: {
            ...base,
            platformId: (u['channelId'] as string) ?? null,
            displayName: (u['name'] as string) ?? null,
            // ponytail: avatar is nested; extract first source URL
            avatarUrl:
              ((u['avatar'] as { image?: { sources?: Array<{ url?: string }> } } | undefined)
                ?.image?.sources?.[0]?.url) ?? null,
            bio: (u['description'] as string) ?? null,
            externalUrl: (u['store'] as string) ?? null,
            followerCount: (u['subscriberCount'] as number) ?? null,
            ytCountry: (u['country'] as string) ?? null,
            ytEmail: (u['email'] as string) ?? null,
            ytJoinedDate: (u['joinedDateText'] as string) ?? null,
          },
          links: ytLinks.map((url) => ({ url })).filter((l) => l.url),
        };
      }

      case 'x': {
        // Response shape: { rest_id, is_blue_verified, legacy: {...} }
        const r = (raw ?? {}) as Record<string, unknown>;
        const leg = (r['legacy'] ?? {}) as Record<string, unknown>;
        return {
          profileData: {
            ...base,
            platformId: (r['rest_id'] as string) ?? null,
            displayName: (leg['name'] as string) ?? null,
            avatarUrl: (leg['profile_image_url_https'] as string) ?? null,
            bio: (leg['description'] as string) ?? null,
            externalUrl: (leg['url'] as string) ?? null,
            verified: (r['is_blue_verified'] as boolean) ?? null,
            followerCount: (leg['followers_count'] as number) ?? null,
            followingCount: (leg['friends_count'] as number) ?? null,
            xLocation: (leg['location'] as string) ?? null,
            xTweetCount: (leg['statuses_count'] as number) ?? null,
          },
          links: [],
        };
      }
    }
  }

  private pickPlatform(
    entries: [string, { value: string; synchronize: boolean } | undefined][],
    platform?: string,
  ): string | undefined {
    if (!platform) return undefined;
    return entries.some(([k]) => k === platform) ? platform : undefined;
  }

  private async fetchProfile(platform: SupportedPlatform, handle: string): Promise<unknown> {
    switch (platform) {
      case 'instagram':
        return this.scrapeCreators.instagramProfile({ handle });
      case 'tiktok':
        return this.scrapeCreators.tiktokProfile({ handle });
      case 'youtube':
        return this.scrapeCreators.youtubeChannel({ handle });
      case 'x':
        return this.scrapeCreators.twitterProfile({ handle });
    }
  }
}