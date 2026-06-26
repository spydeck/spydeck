import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { ScrapeCreatorsClient } from '../scrapecreators/scrapecreators.client';
import { ApifyClient } from '../apify/apify.client';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import {
  linkedinCompanySearches,
  linkedinCompanies as linkedinCompaniesTable,
  metaCompanies as metaCompaniesTable,
  googleCreatives as googleCreativesTable,
} from '../db/schema';
import type { GoogleCreative } from '../db/schema';
import {
  GoogleAdvertisersDto,
  GoogleCompanyAdsDto,
  MetaAdsDto,
  TikTokAdsDto,
  LinkedInAdsDto,
  LinkedInCompaniesDto,
  MetaCompaniesDto,
} from './ads.dto';

// ScrapeCreators has no LinkedIn company-by-name search, so we use this Apify
// actor ("short" mode = lightweight results) to power the company autocomplete.
const LINKEDIN_COMPANY_SEARCH_ACTOR = 'harvestapi~linkedin-company-search';

// Resolves Google ad creative media (incl. video) in a single run from a list
// of transparency creative URLs.
const GOOGLE_ADS_ACTOR = 'silva95gustavo~google-ads-scraper';

interface GoogleAdActorItem {
  creativeId?: string;
  advertiserId?: string;
  format?: string;
  previewUrl?: string | null;
  variations?: Array<{
    headline?: string;
    clickUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
  }>;
}

// ponytail: 30-day refresh window keeps Apify calls minimal; company basics
// rarely change. Lower it if results feel stale.
const COMPANY_SEARCH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface CompanySuggestion {
  name: string;
  companyId: string;
  url: string | null;
  logo: string | null;
  industry: string | null;
  location: string | null;
}

export interface MetaCompanySuggestion {
  pageId: string;
  name: string;
  category: string | null;
  logo: string | null;
  likes: number | null;
  igUsername: string | null;
  igFollowers: number | null;
  verified: boolean;
}

interface MetaCompanyRaw {
  page_id?: string;
  name?: string;
  category?: string;
  image_uri?: string;
  likes?: number;
  verification?: string;
  ig_username?: string;
  ig_followers?: number;
  ig_verification?: boolean;
}

export interface MetaAdRaw {
  page_id?: string;
  snapshot?: {
    page_id?: string;
    page_profile_picture_url?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface LinkedInAdRaw {
  advertiser?: string;
  advertiserLinkedinPage?: string;
  advertiserLogo?: string;
  [k: string]: unknown;
}

// Numeric company id from a LinkedIn company page URL (…/company/1035).
function linkedinCompanyId(url?: string): string | null {
  return url?.match(/\/company\/(\d+)/)?.[1] ?? null;
}

// Cap auto-fetches of company logos per ad search to bound ScrapeCreators cost.
const MAX_LINKEDIN_LOGO_FETCHES = 12;

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly client: ScrapeCreatorsClient,
    private readonly apify: ApifyClient,
    @Inject(DB) private readonly db: DrizzleDB,
  ) {}

  async linkedinCompanies(
    q: LinkedInCompaniesDto,
  ): Promise<{ companies: CompanySuggestion[] }> {
    const query = q.query.trim().toLowerCase();
    if (!query) return { companies: [] };

    // Durable cache: serve persisted results within the TTL, skipping Apify.
    const cached = await this.db.query.linkedinCompanySearches.findFirst({
      where: eq(linkedinCompanySearches.query, query),
    });
    const fresh =
      cached &&
      Date.now() - new Date(cached.updatedAt).getTime() < COMPANY_SEARCH_TTL_MS;
    if (cached && fresh) {
      return { companies: cached.results as CompanySuggestion[] };
    }

    let companies: CompanySuggestion[];
    try {
      const items = await this.apify.runActor<Record<string, unknown>>(
        LINKEDIN_COMPANY_SEARCH_ACTOR,
        { searchQuery: q.query.trim(), scraperMode: 'short', maxItems: 8 },
      );
      companies = items
        .map(normalizeCompany)
        .filter((c): c is CompanySuggestion => c !== null);
    } catch (err) {
      // On actor failure, fall back to stale results rather than erroring.
      if (cached) {
        this.logger.warn(
          `Apify company search failed for "${query}", serving stale cache`,
        );
        return { companies: cached.results as CompanySuggestion[] };
      }
      throw err;
    }

    await this.db
      .insert(linkedinCompanySearches)
      .values({ query, results: companies })
      .onConflictDoUpdate({
        target: linkedinCompanySearches.query,
        set: { results: companies, updatedAt: new Date() },
      });

    // Persist individual companies by id so ad results can render their logos.
    await Promise.all(
      companies.map((c) =>
        this.db
          .insert(linkedinCompaniesTable)
          .values({
            companyId: c.companyId,
            name: c.name,
            logo: c.logo,
            url: c.url,
            industry: c.industry,
            location: c.location,
          })
          .onConflictDoUpdate({
            target: linkedinCompaniesTable.companyId,
            set: {
              name: c.name,
              logo: c.logo,
              url: c.url,
              industry: c.industry,
              location: c.location,
              updatedAt: new Date(),
            },
          }),
      ),
    );

    return { companies };
  }

  googleAdvertisers(p: GoogleAdvertisersDto) {
    return this.client.request('/v1/google/adLibrary/advertisers/search', {
      ...p,
    });
  }

  googleCompanyAds(p: GoogleCompanyAdsDto) {
    return this.client.request('/v1/google/company/ads', { ...p });
  }

  // Resolve creative media (videoUrl/imageUrl) for Google ad transparency URLs.
  // The list endpoint returns no media for video ads; one Apify run covers the
  // whole batch and results are cached per creativeId.
  async googleCreatives(
    urls: string[],
  ): Promise<Record<string, GoogleCreative>> {
    // creativeId -> url, de-duped
    const byId = new Map<string, string>();
    for (const url of urls) {
      const id = url.match(/\/creative\/(CR\d+)/)?.[1];
      if (id && !byId.has(id)) byId.set(id, url);
    }
    if (byId.size === 0) return {};

    const cached = await this.db
      .select()
      .from(googleCreativesTable)
      .where(inArray(googleCreativesTable.creativeId, [...byId.keys()]));
    const result: Record<string, GoogleCreative> = {};
    for (const c of cached) result[c.creativeId] = c;

    const missing = [...byId.entries()].filter(([id]) => !result[id]);
    if (missing.length === 0) return result;

    const items = await this.apify.runActor<GoogleAdActorItem>(
      GOOGLE_ADS_ACTOR,
      {
        startUrls: missing.map(([, url]) => ({ url })),
        skipDetails: false,
        shouldDownloadAssets: false,
        resultsLimit: 1,
      },
    );

    const rows = items
      .filter((it) => it.creativeId)
      .map((it) => {
        const v = it.variations?.[0];
        return {
          creativeId: it.creativeId!,
          advertiserId: it.advertiserId ?? null,
          format: it.format ?? null,
          videoUrl: v?.videoUrl ?? null,
          imageUrl: v?.imageUrl ?? it.previewUrl ?? null,
          headline: v?.headline ?? null,
          clickUrl: v?.clickUrl ?? null,
        };
      });

    if (rows.length > 0) {
      await this.db
        .insert(googleCreativesTable)
        .values(rows)
        .onConflictDoUpdate({
          target: googleCreativesTable.creativeId,
          set: {
            videoUrl: sql`excluded.video_url`,
            imageUrl: sql`excluded.image_url`,
            headline: sql`excluded.headline`,
            clickUrl: sql`excluded.click_url`,
            fetchedAt: new Date(),
          },
        });
      for (const r of rows) result[r.creativeId] = { ...r, fetchedAt: new Date() };
    }

    return result;
  }

  async metaAds(p: MetaAdsDto) {
    const res = await this.client.request<{
      searchResults?: MetaAdRaw[];
    }>('/v1/facebook/adLibrary/search/ads', { ...p });
    await this.applyStoredLogos(res.searchResults ?? []);
    return res;
  }

  // Overwrite each ad's page picture with the stored company logo when we have
  // one (cleaner brand logo than the ad's page_profile_picture_url).
  private async applyStoredLogos(ads: MetaAdRaw[]): Promise<void> {
    const pageIds = [
      ...new Set(
        ads.map((a) => a.snapshot?.page_id ?? a.page_id).filter(Boolean),
      ),
    ] as string[];
    if (pageIds.length === 0) return;
    const rows = await this.db
      .select({
        pageId: metaCompaniesTable.pageId,
        logo: metaCompaniesTable.logo,
      })
      .from(metaCompaniesTable)
      .where(inArray(metaCompaniesTable.pageId, pageIds));
    const logoByPage = new Map(
      rows.filter((r) => r.logo).map((r) => [r.pageId, r.logo as string]),
    );
    if (logoByPage.size === 0) return;
    for (const ad of ads) {
      const pid = ad.snapshot?.page_id ?? ad.page_id;
      const logo = pid ? logoByPage.get(pid) : undefined;
      if (logo && ad.snapshot) ad.snapshot.page_profile_picture_url = logo;
    }
  }

  async metaCompanies(
    q: MetaCompaniesDto,
  ): Promise<{ companies: MetaCompanySuggestion[] }> {
    const res = await this.client.request<{ searchResults?: MetaCompanyRaw[] }>(
      '/v1/facebook/adLibrary/search/companies',
      { query: q.query },
    );
    const companies = (res.searchResults ?? [])
      .map(normalizeMetaCompany)
      .filter((c): c is MetaCompanySuggestion => c !== null);

    // Persist so ad results can later render these companies' logos.
    await Promise.all(
      companies.map((c) =>
        this.db
          .insert(metaCompaniesTable)
          .values({
            pageId: c.pageId,
            name: c.name,
            category: c.category,
            logo: c.logo,
            likes: c.likes,
            igUsername: c.igUsername,
            igFollowers: c.igFollowers,
            verified: c.verified,
          })
          .onConflictDoUpdate({
            target: metaCompaniesTable.pageId,
            set: {
              name: c.name,
              category: c.category,
              logo: c.logo,
              likes: c.likes,
              igUsername: c.igUsername,
              igFollowers: c.igFollowers,
              verified: c.verified,
              updatedAt: new Date(),
            },
          }),
      ),
    );

    return { companies };
  }

  tiktokAds(p: TikTokAdsDto) {
    return this.client.request('/v1/tiktok/ad-library/search', { ...p });
  }

  async linkedinAds(p: LinkedInAdsDto) {
    const res = await this.client.request<{ ads?: LinkedInAdRaw[] }>(
      '/v1/linkedin/ads/search',
      { ...p },
    );
    const ads = res.ads ?? [];
    await this.ensureLinkedinCompanyLogos(ads);
    await this.applyLinkedinLogos(ads);
    return res;
  }

  // LinkedIn ads carry no advertiser logo. For companies we don't have a logo
  // for yet, fetch it once from the company endpoint and persist it.
  private async ensureLinkedinCompanyLogos(ads: LinkedInAdRaw[]): Promise<void> {
    const byId = new Map<string, { url: string; advertiser?: string }>();
    for (const ad of ads) {
      const id = linkedinCompanyId(ad.advertiserLinkedinPage);
      if (id && ad.advertiserLinkedinPage && !byId.has(id)) {
        byId.set(id, { url: ad.advertiserLinkedinPage, advertiser: ad.advertiser });
      }
    }
    if (byId.size === 0) return;

    const existing = await this.db
      .select({
        companyId: linkedinCompaniesTable.companyId,
        logo: linkedinCompaniesTable.logo,
      })
      .from(linkedinCompaniesTable)
      .where(inArray(linkedinCompaniesTable.companyId, [...byId.keys()]));
    const have = new Set(existing.filter((r) => r.logo).map((r) => r.companyId));

    const missing = [...byId.entries()]
      .filter(([id]) => !have.has(id))
      .slice(0, MAX_LINKEDIN_LOGO_FETCHES);
    if (missing.length === 0) return;

    await Promise.all(
      missing.map(async ([id, info]) => {
        try {
          const c = await this.client.request<{
            logo?: string;
            name?: string;
            industry?: string;
          }>('/v1/linkedin/company', { url: info.url });
          if (!c?.logo) return;
          await this.db
            .insert(linkedinCompaniesTable)
            .values({
              companyId: id,
              name: c.name ?? info.advertiser ?? id,
              logo: c.logo,
              url: info.url,
              industry: c.industry ?? null,
            })
            .onConflictDoUpdate({
              target: linkedinCompaniesTable.companyId,
              set: {
                logo: c.logo,
                industry: c.industry ?? null,
                updatedAt: new Date(),
              },
            });
        } catch (err) {
          this.logger.warn(
            `linkedin company logo fetch failed for ${id}: ${(err as Error).message}`,
          );
        }
      }),
    );
  }

  // LinkedIn ads carry no advertiser logo, so attach the stored company logo
  // (matched by the numeric id in advertiserLinkedinPage) when we have one.
  private async applyLinkedinLogos(ads: LinkedInAdRaw[]): Promise<void> {
    const ids = [
      ...new Set(
        ads.map((a) => linkedinCompanyId(a.advertiserLinkedinPage)).filter(Boolean),
      ),
    ] as string[];
    if (ids.length === 0) return;
    const rows = await this.db
      .select({
        companyId: linkedinCompaniesTable.companyId,
        logo: linkedinCompaniesTable.logo,
      })
      .from(linkedinCompaniesTable)
      .where(inArray(linkedinCompaniesTable.companyId, ids));
    const logoById = new Map(
      rows.filter((r) => r.logo).map((r) => [r.companyId, r.logo as string]),
    );
    if (logoById.size === 0) return;
    for (const ad of ads) {
      const id = linkedinCompanyId(ad.advertiserLinkedinPage);
      const logo = id ? logoById.get(id) : undefined;
      if (logo) ad.advertiserLogo = logo;
    }
  }
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = str(obj[k]);
    if (v) return v;
  }
  return null;
}

function normalizeMetaCompany(
  item: MetaCompanyRaw,
): MetaCompanySuggestion | null {
  if (!item.page_id || !item.name) return null;
  return {
    pageId: item.page_id,
    name: item.name,
    category: item.category ?? null,
    logo: item.image_uri ?? null,
    likes: typeof item.likes === 'number' ? item.likes : null,
    igUsername: item.ig_username ?? null,
    igFollowers: typeof item.ig_followers === 'number' ? item.ig_followers : null,
    verified: item.verification === 'BLUE_VERIFIED' || !!item.ig_verification,
  };
}

// The actor's exact field names aren't documented, so probe the common variants.
function normalizeCompany(
  item: Record<string, unknown>,
): CompanySuggestion | null {
  const name = pick(item, ['name', 'companyName', 'title']);
  const companyId = pick(item, [
    'id',
    'companyId',
    'company_id',
    'universalName',
    'publicIdentifier',
  ]);
  if (!name || !companyId) return null;
  return {
    name,
    companyId,
    url: pick(item, ['linkedinUrl', 'url', 'link', 'companyUrl']),
    logo: pick(item, ['logo', 'logoUrl', 'logoResolutionResult', 'image']),
    industry: pick(item, ['industry', 'industryName']),
    location: pick(item, ['location', 'headquarter', 'headquarters']),
  };
}
