import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthorsModule } from '../authors/authors.module';
import { ScrapeCreatorsModule } from '../scrapecreators/scrapecreators.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProfileExtractProcessor } from './profile-extract.processor';
import { SyncPostsProcessor } from './sync-posts.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'profile-extract' }),
    BullModule.registerQueue({ name: 'sync-posts' }),
    AuthorsModule,
    ScrapeCreatorsModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, ProfileExtractProcessor, SyncPostsProcessor],
})
export class SyncModule {}
