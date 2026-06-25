import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { authors } from '../db/schema';
import { CreateAuthorDto, UpdateAuthorDto } from './authors.dto';

@Injectable()
export class AuthorsService {
  private readonly logger = new Logger(AuthorsService.name);

  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  findAll() {
    return this.db.select().from(authors);
  }

  async findOne(id: string) {
    const [row] = await this.db
      .select()
      .from(authors)
      .where(eq(authors.id, id));
    if (!row) throw new NotFoundException(`Author ${id} not found`);
    return row;
  }

  async create(dto: CreateAuthorDto) {
    try {
      const [row] = await this.db.insert(authors).values(dto).returning();
      this.logger.log(`created author ${row.id}`);
      return row;
    } catch (err) {
      this.logger.error(`failed to create author`, (err as Error).stack);
      throw err;
    }
  }

  async update(id: string, dto: UpdateAuthorDto) {
    try {
      const [row] = await this.db
        .update(authors)
        .set({ ...dto, updatedAt: new Date() })
        .where(eq(authors.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Author ${id} not found`);
      return row;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`failed to update author ${id}`, (err as Error).stack);
      throw err;
    }
  }

  async remove(id: string) {
    try {
      const [row] = await this.db
        .delete(authors)
        .where(eq(authors.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Author ${id} not found`);
      return row;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`failed to remove author ${id}`, (err as Error).stack);
      throw err;
    }
  }
}
