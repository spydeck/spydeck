import { Injectable } from '@nestjs/common';
import { ScrapeCreatorsClient } from '../scrapecreators/scrapecreators.client';
import {
  GoogleAdvertisersDto,
  GoogleCompanyAdsDto,
  MetaAdsDto,
  TikTokAdsDto,
  LinkedInAdsDto,
} from './ads.dto';

@Injectable()
export class AdsService {
  constructor(private readonly client: ScrapeCreatorsClient) {}

  googleAdvertisers(p: GoogleAdvertisersDto) {
    return this.client.request('/v1/google/adLibrary/advertisers/search', {
      ...p,
    });
  }

  googleCompanyAds(p: GoogleCompanyAdsDto) {
    return this.client.request('/v1/google/company/ads', { ...p });
  }

  metaAds(p: MetaAdsDto) {
    return this.client.request('/v1/facebook/adLibrary/search/ads', { ...p });
  }

  tiktokAds(p: TikTokAdsDto) {
    return this.client.request('/v1/tiktok/ad-library/search', { ...p });
  }

  linkedinAds(p: LinkedInAdsDto) {
    return this.client.request('/v1/linkedin/ads/search', { ...p });
  }
}
