import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { posts } from '../db/schema';
import { CreateContentDto, UpdateContentDto } from './content.dto';

@Injectable()
export class ContentService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  findAll(authorId?: string) {
    const q = this.db.select().from(posts).orderBy(desc(posts.date));
    if (authorId) return q.where(eq(posts.authorId, authorId));
    return q;
  }

  async findOne(id: string) {
    const [row] = await this.db.select().from(posts).where(eq(posts.id, id));
    if (!row) throw new NotFoundException(`Post ${id} not found`);
    return row;
  }

  async create(dto: CreateContentDto) {
    const [row] = await this.db
      .insert(posts)
      .values({ ...dto, date: new Date(dto.date) })
      .returning();
    return row;
  }

  async update(id: string, dto: UpdateContentDto) {
    const set: Record<string, unknown> = { ...dto, updatedAt: new Date() };
    if (dto.date) set.date = new Date(dto.date);
    const [row] = await this.db
      .update(posts)
      .set(set)
      .where(eq(posts.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Post ${id} not found`);
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db.delete(posts).where(eq(posts.id, id)).returning();
    if (!row) throw new NotFoundException(`Post ${id} not found`);
    return row;
  }
}
