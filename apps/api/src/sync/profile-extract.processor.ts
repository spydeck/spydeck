import { Logger, NotFoundException } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AuthorsService } from '../authors/authors.service';
import { ScrapeCreatorsService } from '../scrapecreators/scrapecreators.service';

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

    // ponytail: TODO persist the extracted profile against the author.
    // A schema field (e.g. authors.profileData jsonb) does not exist yet; add it
    // and call authors.update(authorId, { ... }) here once it lands. For now we
    // log + return the extracted data so callers can inspect it.
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