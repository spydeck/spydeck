import { Inject, Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { swipeFiles, posts } from '../db/schema';
import { CreateSwipeDto } from './swipe.dto';

@Injectable()
export class SwipeService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findAll(authorId?: string) {
    // Join to posts so we return the full post data, filtered optionally by authorId
    const rows = await this.db
      .select({ swipeFile: swipeFiles, post: posts })
      .from(swipeFiles)
      .innerJoin(posts, eq(swipeFiles.postId, posts.id))
      .orderBy(desc(posts.date));

    const filtered = authorId
      ? rows.filter((r) => r.post.authorId === authorId)
      : rows;

    return filtered.map((r) => r.post);
  }

  async save(dto: CreateSwipeDto) {
    // Idempotent: return existing if already saved
    const [existing] = await this.db
      .select()
      .from(swipeFiles)
      .where(eq(swipeFiles.postId, dto.postId));
    if (existing) return existing;
    const [row] = await this.db.insert(swipeFiles).values(dto).returning();
    return row;
  }

  async remove(postId: string) {
    const [row] = await this.db
      .delete(swipeFiles)
      .where(eq(swipeFiles.postId, postId))
      .returning();
    return row ?? null;
  }
}
