import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthorsModule } from '../authors/authors.module';
import { ScrapeCreatorsModule } from '../scrapecreators/scrapecreators.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProfileExtractProcessor } from './profile-extract.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'profile-extract' }),
    AuthorsModule,
    ScrapeCreatorsModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, ProfileExtractProcessor],
})
export class SyncModule {}