import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../db/database.module';
import type { DrizzleDB } from '../db/database.module';
import { authors } from '../db/schema';
import { CreateAuthorDto, UpdateAuthorDto } from './authors.dto';

@Injectable()
export class AuthorsService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  findAll() {
    return this.db.select().from(authors);
  }

  async findOne(id: string) {
    const [row] = await this.db.select().from(authors).where(eq(authors.id, id));
    if (!row) throw new NotFoundException(`Author ${id} not found`);
    return row;
  }

  async create(dto: CreateAuthorDto) {
    const [row] = await this.db.insert(authors).values(dto).returning();
    return row;
  }

  async update(id: string, dto: UpdateAuthorDto) {
    const [row] = await this.db
      .update(authors)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(authors.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Author ${id} not found`);
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db.delete(authors).where(eq(authors.id, id)).returning();
    if (!row) throw new NotFoundException(`Author ${id} not found`);
    return row;
  }
}
