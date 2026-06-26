import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AdsService } from './ads.service';
import {
  GoogleAdvertisersDto,
  GoogleCompanyAdsDto,
  MetaAdsDto,
  TikTokAdsDto,
  LinkedInAdsDto,
  LinkedInCompaniesDto,
  MetaCompaniesDto,
} from './ads.dto';

@Controller('ads')
@UseInterceptors(CacheInterceptor)
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

  @Get('meta/companies')
  metaCompanies(@Query() q: MetaCompaniesDto) {
    return this.adsService.metaCompanies(q);
  }

  @Get('tiktok')
  tiktokAds(@Query() q: TikTokAdsDto) {
    return this.adsService.tiktokAds(q);
  }

  @Get('linkedin')
  linkedinAds(@Query() q: LinkedInAdsDto) {
    return this.adsService.linkedinAds(q);
  }

  @Get('linkedin/companies')
  linkedinCompanies(@Query() q: LinkedInCompaniesDto) {
    return this.adsService.linkedinCompanies(q);
  }
}
