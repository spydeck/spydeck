import { Module } from '@nestjs/common';
import { SwipeAdsController } from './swipe-ads.controller';
import { SwipeAdsService } from './swipe-ads.service';

@Module({
  controllers: [SwipeAdsController],
  providers: [SwipeAdsService],
})
export class SwipeAdsModule {}
