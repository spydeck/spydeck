import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AdDetailStrategyRegistry } from './ad-detail.strategy';
import type { AdDetailPayload } from './ad-detail.strategy';

@Injectable()
@Processor('ad-detail-extract')
export class AdDetailExtractProcessor extends WorkerHost {
  private readonly logger = new Logger(AdDetailExtractProcessor.name);

  constructor(private readonly registry: AdDetailStrategyRegistry) {
    super();
  }

  async process(job: Job<AdDetailPayload>): Promise<unknown> {
    const { platform } = job.data;
    this.logger.log(`ad-detail-extract started for ${platform} (job ${job.id})`);

    try {
      const strategy = this.registry.resolve(platform);
      const detail = await strategy.fetchDetail(job.data);
      this.logger.log(`ad-detail-extract done for ${platform} (job ${job.id})`);
      // ponytail: detail is returned as the job result; persist it to an
      // ad_details table when a consumer needs to read it back later.
      return { ok: true, platform, detail };
    } catch (err) {
      this.logger.error(
        `ad-detail-extract failed for ${platform} (job ${job.id})`,
        (err as Error).stack,
      );
      throw err;
    }
  }
}
