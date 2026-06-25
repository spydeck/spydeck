import { Controller, Get, Query } from '@nestjs/common';
import { AdsService } from './ads.service';
import {
  GoogleAdvertisersDto,
  GoogleCompanyAdsDto,
  MetaAdsDto,
  TikTokAdsDto,
  LinkedInAdsDto,
} from './ads.dto';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('google/advertisers')
  googleAdvertisers(@Query() q: GoogleAdvertisersDto) {
    return this.adsService.googleAdvertisers(q);
  }

  @Get('google/company-ads')
  googleCompanyAds(@Query() q: GoogleCompanyAdsDto) {
    return this.adsService.googleCompanyAds(q);
  }

  @Get('meta')
  metaAds(@Query() q: MetaAdsDto) {
    return this.adsService.metaAds(q);
  }

  @Get('tiktok')
  tiktokAds(@Query() q: TikTokAdsDto) {
    return this.adsService.tiktokAds(q);
  }

  @Get('linkedin')
  linkedinAds(@Query() q: LinkedInAdsDto) {
    return this.adsService.linkedinAds(q);
  }
}
