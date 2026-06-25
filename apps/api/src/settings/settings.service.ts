import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { settings } from '../db/schema';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findAll() {
    const rows = await this.db.select().from(settings);
    // Return as key→value map for convenience
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsert(key: string, value: string) {
    try {
      const [row] = await this.db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        })
        .returning();
      this.logger.log(`upserted setting: ${key}`);
      return row;
    } catch (err) {
      this.logger.error(
        `failed to upsert setting: ${key}`,
        (err as Error).stack,
      );
      throw err;
    }
  }
}
