import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import {
  linkedinCompanies,
  metaCompanies,
  swipeAds,
  swipeAdsCategories,
} from '../db/schema';
import type { NewSwipeAd } from '../db/schema';
import type {
  CreateSwipeAdsCategoryDto,
  SaveSwipeAdDto,
  SetSwipeAdCategoryDto,
  SwipeAdsQueryDto,
} from './swipe-ads.dto';

@Injectable()
export class SwipeAdsService {
  private readonly logger = new Logger(SwipeAdsService.name);

  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async list(q: SwipeAdsQueryDto) {
    const filters = [
      q.categoryId ? eq(swipeAds.categoryId, q.categoryId) : undefined,
      q.source ? eq(swipeAds.source, q.source) : undefined,
    ].filter(Boolean);
    const rows = await this.db
      .select()
      .from(swipeAds)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(swipeAds.createdAt));
    await this.fillMissingLogos(rows);
    return rows;
  }

  // Stored ads (esp. older LinkedIn saves) may lack a logo; backfill it from the
  // company tables by advertiser name so the UI shows the brand logo.
  private async fillMissingLogos(rows: { ad: unknown }[]): Promise<void> {
    type Ad = { advertiser?: string; advertiserLogo?: string | null };
    const needing = rows
      .map((r) => r.ad as Ad)
      .filter((ad) => ad && ad.advertiser && !ad.advertiserLogo);
    const names = [...new Set(needing.map((ad) => ad.advertiser as string))];
    if (names.length === 0) return;

    const [li, meta] = await Promise.all([
      this.db
        .select({ name: linkedinCompanies.name, logo: linkedinCompanies.logo })
        .from(linkedinCompanies)
        .where(inArray(linkedinCompanies.name, names)),
      this.db
        .select({ name: metaCompanies.name, logo: metaCompanies.logo })
        .from(metaCompanies)
        .where(inArray(metaCompanies.name, names)),
    ]);
    const logoByName = new Map<string, string>();
    for (const c of [...li, ...meta]) {
      if (c.logo && !logoByName.has(c.name)) logoByName.set(c.name, c.logo);
    }
    if (logoByName.size === 0) return;

    for (const ad of needing) {
      const logo = ad.advertiser ? logoByName.get(ad.advertiser) : undefined;
      if (logo) ad.advertiserLogo = logo;
    }
  }

  async save(dto: SaveSwipeAdDto) {
    const adId = dto.ad?.id;
    if (typeof adId !== 'string' || !adId) {
      throw new BadRequestException('ad.id is required');
    }
    // Re-saving refreshes the snapshot; only overwrite category/source when the
    // caller explicitly provides them (so a plain re-save keeps the existing one).
    const set: Partial<NewSwipeAd> = { ad: dto.ad, updatedAt: new Date() };
    if (dto.categoryId !== undefined) set.categoryId = dto.categoryId;
    if (dto.source !== undefined) set.source = dto.source;

    const [row] = await this.db
      .insert(swipeAds)
      .values({
        adId,
        ad: dto.ad,
        source: dto.source ?? 'manual',
        categoryId: dto.categoryId ?? null,
      })
      .onConflictDoUpdate({ target: swipeAds.adId, set })
      .returning();
    this.logger.log(
      `saved swipe ad ${adId} (source=${dto.source ?? 'manual'})`,
    );
    return row;
  }

  listCategories() {
    return this.db
      .select()
      .from(swipeAdsCategories)
      .orderBy(asc(swipeAdsCategories.name));
  }

  // Get-or-create by name (name is unique).
  async createCategory(dto: CreateSwipeAdsCategoryDto) {
    await this.db
      .insert(swipeAdsCategories)
      .values({ name: dto.name, color: dto.color ?? null })
      .onConflictDoNothing({ target: swipeAdsCategories.name });
    return this.db.query.swipeAdsCategories.findFirst({
      where: eq(swipeAdsCategories.name, dto.name),
    });
  }

  async remove(adId: string) {
    await this.db.delete(swipeAds).where(eq(swipeAds.adId, adId));
    return { ok: true };
  }

  async setCategory(adId: string, dto: SetSwipeAdCategoryDto) {
    const [row] = await this.db
      .update(swipeAds)
      .set({ categoryId: dto.categoryId, updatedAt: new Date() })
      .where(eq(swipeAds.adId, adId))
      .returning();
    return row;
  }
}
