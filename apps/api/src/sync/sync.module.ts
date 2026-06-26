import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthorsModule } from '../authors/authors.module';
import { ScrapeCreatorsModule } from '../scrapecreators/scrapecreators.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProfileExtractProcessor } from './profile-extract.processor';
import { SyncPostsProcessor } from './sync-posts.processor';
import { AdDetailExtractProcessor } from './ad-detail-extract.processor';
import {
  AD_DETAIL_STRATEGY,
  AdDetailStrategyRegistry,
  GoogleAdDetailStrategy,
  LinkedInAdDetailStrategy,
  MetaAdDetailStrategy,
  TikTokAdDetailStrategy,
  type AdDetailStrategy,
} from './ad-detail.strategy';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'profile-extract' }),
    BullModule.registerQueue({ name: 'sync-posts' }),
    BullModule.registerQueue({ name: 'ad-detail-extract' }),
    AuthorsModule,
    ScrapeCreatorsModule,
  ],
  controllers: [SyncController],
  providers: [
    SyncService,
    ProfileExtractProcessor,
    SyncPostsProcessor,
    AdDetailExtractProcessor,
    LinkedInAdDetailStrategy,
    MetaAdDetailStrategy,
    TikTokAdDetailStrategy,
    GoogleAdDetailStrategy,
    AdDetailStrategyRegistry,
    {
      provide: AD_DETAIL_STRATEGY,
      useFactory: (...strategies: AdDetailStrategy[]) => strategies,
      inject: [
        LinkedInAdDetailStrategy,
        MetaAdDetailStrategy,
        TikTokAdDetailStrategy,
        GoogleAdDetailStrategy,
      ],
    },
  ],
})
export class SyncModule {}
