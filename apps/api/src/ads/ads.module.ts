import { Module } from '@nestjs/common';
import { ScrapeCreatorsModule } from '../scrapecreators/scrapecreators.module';
import { ApifyModule } from '../apify/apify.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [ScrapeCreatorsModule, ApifyModule],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
