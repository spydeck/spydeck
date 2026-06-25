import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ProfileExtractPayload } from './profile-extract.processor';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(@InjectQueue('profile-extract') private readonly queue: Queue) {}

  health() {
    this.logger.debug('sync health check');
    return {
      status: 'ok',
      service: 'sync',
      timestamp: new Date().toISOString(),
    };
  }

  async enqueueProfileExtract(
    payload: ProfileExtractPayload,
  ): Promise<{ jobId: string }> {
    try {
      const job = await this.queue.add('profile-extract', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      const jobId = job.id ?? '';
      this.logger.log(
        `enqueued profile-extract job ${jobId} for author ${payload.authorId}`,
      );
      return { jobId };
    } catch (err) {
      this.logger.error(
        `failed to enqueue profile-extract for author ${payload.authorId}`,
        (err as Error).stack,
      );
      throw err;
    }
  }
}
