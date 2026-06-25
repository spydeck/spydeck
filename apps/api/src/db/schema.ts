import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Mirrors PlatformKey from apps/web/lib/authors.ts
export const platformEnum = pgEnum('platform', [
  'instagram',
  'tiktok',
  'youtube',
  'x',
  'facebook',
]);

// Mirrors PostStatus from apps/web/lib/posts.ts
export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'scheduled',
  'published',
]);

// Mirrors Author type: { id, name, socials: Partial<Record<PlatformKey, { value, synchronize }>> }
export const authors = pgTable('authors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // ponytail: jsonb for socials keeps schema simple; normalize if query patterns demand it
  socials: jsonb('socials')
    .$type<Partial<Record<string, { value: string; synchronize: boolean }>>>()
    .default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Mirrors Post type: { id, authorId, platform, text, mediaUrl?, status, date, engagement }
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => authors.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  text: text('text').notNull().default(''),
  mediaUrl: text('media_url'),
  status: postStatusEnum('status').notNull().default('draft'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  // ponytail: jsonb for engagement matches the web type without a separate table
  engagement: jsonb('engagement')
    .$type<{ likes: number; comments: number; views: number; shares: number }>()
    .default({ likes: 0, comments: 0, views: 0, shares: 0 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
