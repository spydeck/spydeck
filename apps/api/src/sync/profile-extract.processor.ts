import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { authorsProfiles } from '../db/schema';

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

    const profile = await this.fetchProfile(chosen as SupportedPlatform, handle);
    this.logger.log(`profile fetched for ${author.name} @ ${chosen}/${handle}`);

    // ponytail: upsert on (authorId, platform) so re-extraction refreshes the row.
    await this.db
      .insert(authorsProfiles)
      .values({ authorId, platform: chosen as SupportedPlatform, handle, profile })
      .onConflictDoUpdate({
        target: [authorsProfiles.authorId, authorsProfiles.platform],
        set: { handle, profile, updatedAt: new Date() },
      })
      .execute();

    return { authorId, platform: chosen, handle, profile };
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