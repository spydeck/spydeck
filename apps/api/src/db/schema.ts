import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  pgEnum,
  unique,
  integer,
  boolean,
  index,
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
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Mirrors Post type: { id, authorId, platform, text, mediaUrl?, videoUrl?, postUrl?, status, date, likes, views, shares, comments }
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => authors.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  text: text('text').notNull().default(''),
  mediaUrl: text('media_url'),
  videoUrl: text('video_url'),
  postUrl: text('post_url'),
  status: postStatusEnum('status').notNull().default('draft'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  // Engagement counts as first-class columns so they can be sorted/filtered in SQL.
  likes: integer('likes').notNull().default(0),
  views: integer('views').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  comments: integer('comments').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ponytail: no userId — single implicit user; add userId FK when auth lands
export const swipeFiles = pgTable('swipe_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .unique()
    .references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ponytail: key/value is enough for now; typed settings table if values diverge
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Normalized ScrapeCreators profile data. One row per (author, platform).
// 3NF: every non-key column depends only on the PK. Platform-specific counts live
// as nullable columns here rather than a child table — they have no independent key
// and there's no partial dependency (all depend on the (authorId, platform) composite).
// Repeating groups (links[]) are extracted to authors_profile_links (1NF).
// ponytail: `raw` jsonb keeps the full API response as escape hatch for fields not
// worth querying on (TikTok commerceUserInfo, IG biography_with_entities, Twitter
// affiliates_highlighted_label, YouTube avatar loggingDirectives, etc.).
export const authorsProfiles = pgTable(
  'authors_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),

    // ── Common fields present in all four supported platforms ─────────────────
    handle: text('handle').notNull(),
    // Platform-native user/channel ID (TikTok user.id, IG user.id, YT channelId, Twitter rest_id)
    platformId: text('platform_id'),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    externalUrl: text('external_url'),
    // followerCount covers TikTok stats.followerCount, IG edge_followed_by.count,
    // YT subscriberCount, Twitter legacy.followers_count
    followerCount: integer('follower_count'),
    followingCount: integer('following_count'),
    // verified: TikTok user.verified, IG is_verified, Twitter is_blue_verified
    // (YouTube has no verified field in the response)
    verified: boolean('verified'),

    // ── TikTok-specific ───────────────────────────────────────────────────────
    // ponytail: nullable; NULL for non-TikTok rows
    tiktokLikeCount: integer('tiktok_like_count'), // stats.heart (total likes received)
    tiktokVideoCount: integer('tiktok_video_count'), // stats.videoCount

    // ── Instagram-specific ────────────────────────────────────────────────────
    igIsPrivate: boolean('ig_is_private'),
    igIsBusinessAccount: boolean('ig_is_business_account'),
    igCategoryName: text('ig_category_name'),

    // ── YouTube-specific ──────────────────────────────────────────────────────
    ytCountry: text('yt_country'),
    ytEmail: text('yt_email'),
    ytJoinedDate: text('yt_joined_date'), // "Joined Aug 23, 2017" — store as text; parse if needed

    // ── Twitter/X-specific ────────────────────────────────────────────────────
    xLocation: text('x_location'),
    xTweetCount: integer('x_tweet_count'), // legacy.statuses_count

    // ── Escape hatch ──────────────────────────────────────────────────────────
    // Full raw API payload. Keeps fields that aren't worth querying (nested metadata,
    // CDN-signed avatar URLs with expiry params, entity annotations, etc.).
    raw: jsonb('raw').$type<unknown>(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // One row per (author, platform); upsert target.
    unique('authors_profiles_author_id_platform_unique').on(
      table.authorId,
      table.platform,
    ),
  ],
);

// Repeating link groups extracted for 1NF.
// Instagram returns bio_links[], YouTube returns links[].
// sort_order preserves the original array position.
export const authorsProfileLinks = pgTable(
  'authors_profile_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => authorsProfiles.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    title: text('title'), // IG bio_links have a title; YT links are bare URLs
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('authors_profile_links_profile_id_idx').on(table.profileId),
  ],
);

// Per (author, platform) sync scope chosen by the user when adding the author.
// A future posts-sync operation reads this to decide how far back to fetch.
export const authorSyncConfigs = pgTable(
  'author_sync_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    // 'full' = all posts, 'count' = last N posts, 'range' = date window
    mode: text('mode')
      .$type<'full' | 'count' | 'range'>()
      .notNull()
      .default('full'),
    postCount: integer('post_count'), // set when mode = 'count'
    fromDate: text('from_date'), // ISO date string, set when mode = 'range'
    toDate: text('to_date'), // ISO date string, set when mode = 'range'
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('author_sync_configs_author_id_platform_unique').on(
      table.authorId,
      table.platform,
    ),
  ],
);

export const authorsRelations = relations(authors, ({ many }) => ({
  profiles: many(authorsProfiles),
  syncConfigs: many(authorSyncConfigs),
}));

export const authorsProfilesRelations = relations(
  authorsProfiles,
  ({ one, many }) => ({
    author: one(authors, {
      fields: [authorsProfiles.authorId],
      references: [authors.id],
    }),
    links: many(authorsProfileLinks),
  }),
);

export const authorSyncConfigsRelations = relations(
  authorSyncConfigs,
  ({ one }) => ({
    author: one(authors, {
      fields: [authorSyncConfigs.authorId],
      references: [authors.id],
    }),
  }),
);

export const authorsProfileLinksRelations = relations(
  authorsProfileLinks,
  ({ one }) => ({
    profile: one(authorsProfiles, {
      fields: [authorsProfileLinks.profileId],
      references: [authorsProfiles.id],
    }),
  }),
);

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type SwipeFile = typeof swipeFiles.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type AuthorProfile = typeof authorsProfiles.$inferSelect;
export type NewAuthorProfile = typeof authorsProfiles.$inferInsert;
export type AuthorProfileLink = typeof authorsProfileLinks.$inferSelect;
export type NewAuthorProfileLink = typeof authorsProfileLinks.$inferInsert;
export type AuthorSyncConfig = typeof authorSyncConfigs.$inferSelect;
export type NewAuthorSyncConfig = typeof authorSyncConfigs.$inferInsert;
