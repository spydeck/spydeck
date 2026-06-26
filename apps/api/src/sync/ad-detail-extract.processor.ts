import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AdDetailStrategyRegistry } from './ad-detail.strategy';
import type { AdDetailPayload } from './ad-detail.strategy';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { adDetails } from '../db/schema';

@Injectable()
@Processor('ad-detail-extract')
export class AdDetailExtractProcessor extends WorkerHost {
  private readonly logger = new Logger(AdDetailExtractProcessor.name);

  constructor(
    private readonly registry: AdDetailStrategyRegistry,
    @Inject(DB) private readonly db: DrizzleDB,
  ) {
    super();
  }

  async process(job: Job<AdDetailPayload>): Promise<unknown> {
    const { platform, externalId, url } = job.data;
    this.logger.log(
      `ad-detail-extract started for ${platform}:${externalId} (job ${job.id})`,
    );

    try {
      const strategy = this.registry.resolve(platform);
      const detail = await strategy.fetchDetail(job.data);

      // Upsert: re-fetching the same ad refreshes its stored detail.
      await this.db
        .insert(adDetails)
        .values({ platform, externalId, sourceUrl: url ?? null, detail })
        .onConflictDoUpdate({
          target: [adDetails.platform, adDetails.externalId],
          set: {
            detail,
            sourceUrl: url ?? null,
            fetchedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      this.logger.log(
        `ad-detail-extract persisted ${platform}:${externalId} (job ${job.id})`,
      );
      return { ok: true, platform, externalId };
    } catch (err) {
      this.logger.error(
        `ad-detail-extract failed for ${platform}:${externalId} (job ${job.id})`,
        (err as Error).stack,
      );
      throw err;
    }
  }
}
