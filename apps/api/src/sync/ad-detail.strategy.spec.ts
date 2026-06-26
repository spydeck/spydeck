import {
  AdDetailStrategyRegistry,
  GoogleAdDetailStrategy,
  LinkedInAdDetailStrategy,
  MetaAdDetailStrategy,
  TikTokAdDetailStrategy,
} from './ad-detail.strategy';

function makeClient() {
  return { request: jest.fn().mockResolvedValue({ ok: true }) } as any;
}

function makeRegistry(client: any) {
  return new AdDetailStrategyRegistry([
    new LinkedInAdDetailStrategy(client),
    new MetaAdDetailStrategy(client),
    new TikTokAdDetailStrategy(client),
    new GoogleAdDetailStrategy(client),
  ]);
}

describe('AdDetailStrategyRegistry', () => {
  it('resolves a strategy for each supported platform', () => {
    const registry = makeRegistry(makeClient());
    for (const platform of ['linkedin', 'meta', 'tiktok', 'google'] as const) {
      expect(registry.resolve(platform).platform).toBe(platform);
    }
  });

  it('throws for an unknown platform', () => {
    const registry = makeRegistry(makeClient());
    expect(() => registry.resolve('snap' as any)).toThrow(/no ad-detail strategy/i);
  });
});

describe('ad detail strategies', () => {
  it('LinkedIn fetches the ad endpoint by url', async () => {
    const client = makeClient();
    await new LinkedInAdDetailStrategy(client).fetchDetail({
      platform: 'linkedin',
      url: 'https://www.linkedin.com/ad-library/detail/123',
    });
    expect(client.request).toHaveBeenCalledWith('/v1/linkedin/ad', {
      url: 'https://www.linkedin.com/ad-library/detail/123',
    });
  });

  it('LinkedIn requires a url', () => {
    expect(() =>
      new LinkedInAdDetailStrategy(makeClient()).fetchDetail({ platform: 'linkedin' }),
    ).toThrow(/url/i);
  });

  it('Meta and TikTok fetch by ad id with their endpoint param names', async () => {
    const client = makeClient();
    await new MetaAdDetailStrategy(client).fetchDetail({
      platform: 'meta',
      adId: '702369045530963',
    });
    expect(client.request).toHaveBeenCalledWith('/v1/facebook/adLibrary/ad', {
      id: '702369045530963',
    });
    await new TikTokAdDetailStrategy(client).fetchDetail({
      platform: 'tiktok',
      adId: '7642386438915309575',
    });
    expect(client.request).toHaveBeenCalledWith('/v1/tiktok/ad-library/ad', {
      ad_id: '7642386438915309575',
    });
  });

  it('Google fetches the ad endpoint by url', async () => {
    const client = makeClient();
    await new GoogleAdDetailStrategy(client).fetchDetail({
      platform: 'google',
      url: 'https://adstransparency.google.com/advertiser/AR1/creative/CR1',
    });
    expect(client.request).toHaveBeenCalledWith('/v1/google/ad', {
      url: 'https://adstransparency.google.com/advertiser/AR1/creative/CR1',
    });
  });

  it('id/url is required per platform', () => {
    const client = makeClient();
    expect(() =>
      new MetaAdDetailStrategy(client).fetchDetail({ platform: 'meta' }),
    ).toThrow(/adId/i);
    expect(() =>
      new TikTokAdDetailStrategy(client).fetchDetail({ platform: 'tiktok' }),
    ).toThrow(/adId/i);
    expect(() =>
      new GoogleAdDetailStrategy(client).fetchDetail({ platform: 'google' }),
    ).toThrow(/url/i);
    expect(client.request).not.toHaveBeenCalled();
  });
});
