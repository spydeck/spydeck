import { Inject, Injectable } from '@nestjs/common';
import { ScrapeCreatorsClient } from '../scrapecreators/scrapecreators.client';

export type AdPlatform = 'linkedin' | 'meta' | 'tiktok' | 'google';

export interface AdDetailPayload {
  platform: AdPlatform;
  /** Stable ad identifier used as the persistence key (upsert target). */
  externalId: string;
  /** The ad's public URL — used by LinkedIn and Google. */
  url?: string;
  /** The ad's archive/material id — used by Meta and TikTok. */
  adId?: string;
}

/**
 * Strategy: one concrete detail fetcher per network. Each owns its
 * ScrapeCreators endpoint and the param shape that endpoint expects, so adding
 * a network is a new class — the processor and queue never change.
 */
export interface AdDetailStrategy {
  readonly platform: AdPlatform;
  fetchDetail(payload: AdDetailPayload): Promise<unknown>;
}

/** DI token for the multi-provided list of strategies. */
export const AD_DETAIL_STRATEGY = Symbol('AD_DETAIL_STRATEGY');

@Injectable()
export class LinkedInAdDetailStrategy implements AdDetailStrategy {
  readonly platform = 'linkedin' as const;
  constructor(private readonly client: ScrapeCreatorsClient) {}

  fetchDetail({ url }: AdDetailPayload): Promise<unknown> {
    if (!url) throw new Error('LinkedIn ad detail requires `url`');
    return this.client.request('/v1/linkedin/ad', { url });
  }
}

@Injectable()
export class MetaAdDetailStrategy implements AdDetailStrategy {
  readonly platform = 'meta' as const;
  constructor(private readonly client: ScrapeCreatorsClient) {}

  fetchDetail({ adId }: AdDetailPayload): Promise<unknown> {
    if (!adId) throw new Error('Meta ad detail requires `adId`');
    return this.client.request('/v1/facebook/adLibrary/ad', { id: adId });
  }
}

@Injectable()
export class TikTokAdDetailStrategy implements AdDetailStrategy {
  readonly platform = 'tiktok' as const;
  constructor(private readonly client: ScrapeCreatorsClient) {}

  fetchDetail({ adId }: AdDetailPayload): Promise<unknown> {
    if (!adId) throw new Error('TikTok ad detail requires `adId`');
    return this.client.request('/v1/tiktok/ad-library/ad', { ad_id: adId });
  }
}

@Injectable()
export class GoogleAdDetailStrategy implements AdDetailStrategy {
  readonly platform = 'google' as const;
  constructor(private readonly client: ScrapeCreatorsClient) {}

  fetchDetail({ url }: AdDetailPayload): Promise<unknown> {
    if (!url) throw new Error('Google ad detail requires `url`');
    return this.client.request('/v1/google/ad', { url });
  }
}

/**
 * Factory: resolves the right strategy for a platform from the DI-injected set.
 * Strategies self-register by their `platform`, so the map needs no manual upkeep.
 */
@Injectable()
export class AdDetailStrategyRegistry {
  private readonly byPlatform: Map<AdPlatform, AdDetailStrategy>;

  constructor(
    @Inject(AD_DETAIL_STRATEGY) strategies: AdDetailStrategy[],
  ) {
    this.byPlatform = new Map(strategies.map((s) => [s.platform, s]));
  }

  resolve(platform: AdPlatform): AdDetailStrategy {
    const strategy = this.byPlatform.get(platform);
    if (!strategy) {
      throw new Error(`No ad-detail strategy registered for platform: ${platform}`);
    }
    return strategy;
  }
}
