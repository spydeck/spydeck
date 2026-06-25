import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ScrapeCreatorsController } from './scrapecreators.controller';
import { ScrapeCreatorsClient } from './scrapecreators.client';
import { ScrapeCreatorsService } from './scrapecreators.service';
import { ScrapeCreatorsAccountService } from './scrapecreators-account.service';

@Module({
  imports: [SettingsModule],
  controllers: [ScrapeCreatorsController],
  providers: [
    ScrapeCreatorsClient,
    ScrapeCreatorsService,
    ScrapeCreatorsAccountService,
  ],
  exports: [ScrapeCreatorsService, ScrapeCreatorsClient],
})
export class ScrapeCreatorsModule {}
