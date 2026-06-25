import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { posts } from '../db/schema';
import { CreateContentDto, UpdateContentDto } from './content.dto';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

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
    try {
      const [row] = await this.db
        .insert(posts)
        .values({ ...dto, date: new Date(dto.date) })
        .returning();
      this.logger.log(`created post ${row.id}`);
      return row;
    } catch (err) {
      this.logger.error(`failed to create post`, (err as Error).stack);
      throw err;
    }
  }

  async update(id: string, dto: UpdateContentDto) {
    try {
      const set: Record<string, unknown> = { ...dto, updatedAt: new Date() };
      if (dto.date) set.date = new Date(dto.date);
      const [row] = await this.db
        .update(posts)
        .set(set)
        .where(eq(posts.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Post ${id} not found`);
      return row;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`failed to update post ${id}`, (err as Error).stack);
      throw err;
    }
  }

  async remove(id: string) {
    try {
      const [row] = await this.db
        .delete(posts)
        .where(eq(posts.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Post ${id} not found`);
      return row;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`failed to remove post ${id}`, (err as Error).stack);
      throw err;
    }
  }
}
