import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { and, eq } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { authorSyncConfigs } from '../db/schema';
import { ProfileExtractPayload } from './profile-extract.processor';
import type { SyncPostsPayload } from './sync-posts.processor';
import type { AdDetailPayload } from './ad-detail.strategy';
import type { SyncConfigItemDto } from './sync.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectQueue('profile-extract') private readonly queue: Queue,
    @InjectQueue('sync-posts') private readonly syncPostsQueue: Queue,
    @InjectQueue('ad-detail-extract') private readonly adDetailQueue: Queue,
    @Inject(DB) private readonly db: DrizzleDB,
  ) {}

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

  async enqueueSyncPosts(
    payload: SyncPostsPayload,
  ): Promise<{ jobId: string }> {
    try {
      const job = await this.syncPostsQueue.add('sync-posts', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      const jobId = job.id ?? '';
      this.logger.log(
        `enqueued sync-posts job ${jobId} for author ${payload.authorId}`,
      );
      return { jobId };
    } catch (err) {
      this.logger.error(
        `failed to enqueue sync-posts for author ${payload.authorId}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  async enqueueAdDetailExtract(
    payload: AdDetailPayload,
  ): Promise<{ jobId: string }> {
    try {
      const job = await this.adDetailQueue.add('ad-detail-extract', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      const jobId = job.id ?? '';
      this.logger.log(
        `enqueued ad-detail-extract job ${jobId} for ${payload.platform}`,
      );
      return { jobId };
    } catch (err) {
      this.logger.error(
        `failed to enqueue ad-detail-extract for ${payload.platform}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  async saveSyncConfigs(authorId: string, items: SyncConfigItemDto[]) {
    try {
      const rows = await Promise.all(
        items.map((item) => {
          // Null out fields irrelevant to the mode so stale data never leaks
          const postCount = item.mode === 'count' ? (item.count ?? null) : null;
          const fromDate = item.mode === 'range' ? (item.from ?? null) : null;
          const toDate = item.mode === 'range' ? (item.to ?? null) : null;

          return this.db
            .insert(authorSyncConfigs)
            .values({
              authorId,
              platform: item.platform,
              mode: item.mode,
              postCount,
              fromDate,
              toDate,
            })
            .onConflictDoUpdate({
              target: [authorSyncConfigs.authorId, authorSyncConfigs.platform],
              set: {
                mode: item.mode,
                postCount,
                fromDate,
                toDate,
                updatedAt: new Date(),
              },
            })
            .returning();
        }),
      );
      this.logger.log(
        `saved ${items.length} sync config(s) for author ${authorId}`,
      );
      return rows.flat();
    } catch (err) {
      this.logger.error(
        `failed to save sync configs for author ${authorId}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  async getSyncConfig(authorId: string, platform: string) {
    return this.db.query.authorSyncConfigs.findFirst({
      where: and(
        eq(authorSyncConfigs.authorId, authorId),
        eq(authorSyncConfigs.platform, platform as any),
      ),
    });
  }
}
