import { Module } from '@nestjs/common';
import { ScrapeCreatorsModule } from '../scrapecreators/scrapecreators.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [ScrapeCreatorsModule],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
