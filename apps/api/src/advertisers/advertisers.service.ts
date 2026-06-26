import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { advertiserChannels, advertisers } from '../db/schema';
import type {
  AdvertiserChannelDto,
  CreateAdvertiserDto,
} from './advertisers.dto';

@Injectable()
export class AdvertisersService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  list() {
    return this.db.query.advertisers.findMany({
      with: { channels: true },
      orderBy: asc(advertisers.name),
    });
  }

  async create(dto: CreateAdvertiserDto) {
    const [advertiser] = await this.db
      .insert(advertisers)
      .values({ name: dto.name, logo: dto.logo ?? null })
      .returning();

    if (dto.channels?.length) {
      await this.db.insert(advertiserChannels).values(
        dto.channels.map((c) => ({
          advertiserId: advertiser.id,
          platform: c.platform,
          externalId: c.externalId,
          name: c.name,
          url: c.url ?? null,
          logo: c.logo ?? null,
        })),
      );
    }

    return this.db.query.advertisers.findFirst({
      where: eq(advertisers.id, advertiser.id),
      with: { channels: true },
    });
  }

  async remove(id: string) {
    await this.db.delete(advertisers).where(eq(advertisers.id, id));
    return { ok: true };
  }

  // Add or replace the channel for a platform (one per platform per advertiser).
  async addChannel(advertiserId: string, dto: AdvertiserChannelDto) {
    const [row] = await this.db
      .insert(advertiserChannels)
      .values({
        advertiserId,
        platform: dto.platform,
        externalId: dto.externalId,
        name: dto.name,
        url: dto.url ?? null,
        logo: dto.logo ?? null,
      })
      .onConflictDoUpdate({
        target: [advertiserChannels.advertiserId, advertiserChannels.platform],
        set: {
          externalId: dto.externalId,
          name: dto.name,
          url: dto.url ?? null,
          logo: dto.logo ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async removeChannel(advertiserId: string, channelId: string) {
    await this.db
      .delete(advertiserChannels)
      .where(
        and(
          eq(advertiserChannels.id, channelId),
          eq(advertiserChannels.advertiserId, advertiserId),
        ),
      );
    return { ok: true };
  }
}
