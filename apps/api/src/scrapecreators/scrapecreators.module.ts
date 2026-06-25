import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { ScrapeCreatorsController } from './scrapecreators.controller';
import { ScrapeCreatorsService } from './scrapecreators.service';

@Module({
  imports: [SettingsModule],
  controllers: [ScrapeCreatorsController],
  providers: [ScrapeCreatorsService],
})
export class ScrapeCreatorsModule {}
