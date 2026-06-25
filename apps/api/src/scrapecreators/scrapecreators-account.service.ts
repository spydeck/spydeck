import { Injectable } from '@nestjs/common';
import { ScrapeCreatorsClient } from './scrapecreators.client';

@Injectable()
export class ScrapeCreatorsAccountService {
  constructor(private readonly client: ScrapeCreatorsClient) {}

  creditBalance() {
    return this.client.request('/v1/account/credit-balance');
  }

  requestHistory() {
    return this.client.request('/v1/account/get-api-usage');
  }

  dailyUsage() {
    return this.client.request('/v1/account/get-daily-usage-count');
  }

  mostUsedRoutes() {
    return this.client.request('/v1/account/get-most-used-routes');
  }
}
