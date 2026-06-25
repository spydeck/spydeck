import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

// ponytail: no userId — single implicit user; add userId FK when auth lands
export const swipeFiles = pgTable('swipe_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .unique()
    .references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ponytail: key/value is enough for now; typed settings table if values diverge
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Stores ScrapeCreators profile payloads fetched by the profile-extract processor.
// ponytail: jsonb `profile` instead of a column-per-field — each platform returns a different shape.
export const authorsProfiles = pgTable(
  'authors_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    handle: text('handle').notNull(),
    profile: jsonb('profile').$type<unknown>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // ponytail: one row per (author, platform); upsert keyed on this.
    unique('authors_profiles_author_id_platform_unique').on(table.authorId, table.platform),
  ],
);

export const authorsRelations = relations(authors, ({ many }) => ({
  profiles: many(authorsProfiles),
}));

export const authorsProfilesRelations = relations(authorsProfiles, ({ one }) => ({
  author: one(authors, {
    fields: [authorsProfiles.authorId],
    references: [authors.id],
  }),
}));

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type SwipeFile = typeof swipeFiles.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type AuthorProfile = typeof authorsProfiles.$inferSelect;
export type NewAuthorProfile = typeof authorsProfiles.$inferInsert;
