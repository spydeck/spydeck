import { Injectable } from '@nestjs/common';
import { ApifyClient } from './apify.client';

interface ApifyLimitsResponse {
  data: {
    limits: { maxMonthlyUsageUsd: number };
    current: { monthlyUsageUsd: number };
  };
}

export interface ApifyUsage {
  used: number;
  limit: number;
  remaining: number;
}

@Injectable()
export class ApifyService {
  constructor(private readonly client: ApifyClient) {}

  async getUsage(): Promise<ApifyUsage> {
    const { data } = await this.client.request<ApifyLimitsResponse>('/v2/users/me/limits');
    const used = data.current.monthlyUsageUsd;
    const limit = data.limits.maxMonthlyUsageUsd;
    return { used, limit, remaining: limit - used };
  }
}
