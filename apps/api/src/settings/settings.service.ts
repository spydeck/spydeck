import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { settings } from '../db/schema';

@Injectable()
export class SettingsService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findAll() {
    const rows = await this.db.select().from(settings);
    // Return as key→value map for convenience
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsert(key: string, value: string) {
    const [row] = await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return row;
  }
}
