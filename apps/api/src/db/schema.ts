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

// User-defined categories for organizing swipe ads.
export const swipeAdsCategories = pgTable('swipe_ads_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Cache of Google ad creative media (resolved via Apify), keyed by creativeId.
// The Google ads list endpoint returns no media for video ads, so we resolve it
// once per creative and reuse it.
export const googleCreatives = pgTable('google_creatives', {
  creativeId: text('creative_id').primaryKey(),
  advertiserId: text('advertiser_id'),
  format: text('format'),
  videoUrl: text('video_url'),
  imageUrl: text('image_url'),
  headline: text('headline'),
  clickUrl: text('click_url'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// An advertiser (e.g. "Lusha") the user tracks. Its presence on each ad
// platform lives in advertiser_channels.
export const advertisers = pgTable('advertisers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logo: text('logo'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const advertiserPlatformEnum = pgEnum('advertiser_platform', [
  'linkedin',
  'meta',
  'google',
  'tiktok',
]);

// One per (advertiser, platform): the advertiser's account on that ad library.
export const advertiserChannels = pgTable(
  'advertiser_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advertiserId: uuid('advertiser_id')
      .notNull()
      .references(() => advertisers.id, { onDelete: 'cascade' }),
    platform: advertiserPlatformEnum('platform').notNull(),
    // LinkedIn companyId, Meta pageId, Google advertiser_id, TikTok brand/keyword.
    externalId: text('external_id').notNull(),
    name: text('name').notNull(),
    url: text('url'),
    logo: text('logo'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('advertiser_channels_advertiser_platform_unique').on(
      table.advertiserId,
      table.platform,
    ),
  ],
);

export const advertisersRelations = relations(advertisers, ({ many }) => ({
  channels: many(advertiserChannels),
}));

export const advertiserChannelsRelations = relations(
  advertiserChannels,
  ({ one }) => ({
    advertiser: one(advertisers, {
      fields: [advertiserChannels.advertiserId],
      references: [advertisers.id],
    }),
  }),
);

// Saved ("swiped") ads, persisted server-side. `ad` holds the full NormalizedAd
// view model; one row per external ad id.
export const swipeAds = pgTable('swipe_ads', {
  id: uuid('id').primaryKey().defaultRandom(),
  adId: text('ad_id').notNull().unique(),
  ad: jsonb('ad').$type<unknown>().notNull(),
  // Where the ad came from: saved manually or ingested from Telegram.
  source: text('source')
    .$type<'manual' | 'telegram'>()
    .notNull()
    .default('manual'),
  categoryId: uuid('category_id').references(() => swipeAdsCategories.id, {
    onDelete: 'set null',
  }),
  // Date the ad was added.
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
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

// Ad-library platforms differ from the social platforms above (no Instagram/X),
// so they get their own enum.
export const adPlatformEnum = pgEnum('ad_platform', [
  'linkedin',
  'meta',
  'tiktok',
  'google',
]);

// Persisted ad detail fetched by the sync `ad-detail-extract` queue. One row per
// (platform, externalId); re-fetching upserts. `detail` keeps the full raw
// ScrapeCreators payload — the shape differs per platform and isn't worth
// normalizing until a query pattern demands it.
export const adDetails = pgTable(
  'ad_details',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: adPlatformEnum('platform').notNull(),
    // Stable ad identifier (LinkedIn/Meta/TikTok ad id, Google creativeId).
    externalId: text('external_id').notNull(),
    // What was used to fetch it: ad URL (LinkedIn/Google) or ad id (Meta/TikTok).
    sourceUrl: text('source_url'),
    detail: jsonb('detail').$type<unknown>(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('ad_details_platform_external_id_unique').on(
      table.platform,
      table.externalId,
    ),
  ],
);

// Meta (Facebook) pages seen in company searches. Persisted so ad results can
// show the real company logo instead of an initial placeholder.
export const metaCompanies = pgTable('meta_companies', {
  pageId: text('page_id').primaryKey(),
  name: text('name').notNull(),
  category: text('category'),
  logo: text('logo'),
  likes: integer('likes'),
  igUsername: text('ig_username'),
  igFollowers: integer('ig_followers'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// LinkedIn companies seen in company searches, keyed by numeric company id.
// Lets ad results show the company logo (LinkedIn ads carry no advertiser logo).
export const linkedinCompanies = pgTable('linkedin_companies', {
  companyId: text('company_id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  url: text('url'),
  industry: text('industry'),
  location: text('location'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Durable cache of LinkedIn company searches (Apify is metered, so we persist
// results by query to keep API calls to a minimum across restarts/evictions).
export const linkedinCompanySearches = pgTable('linkedin_company_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Normalized (trimmed + lowercased) search term; upsert key.
  query: text('query').notNull().unique(),
  results: jsonb('results').$type<unknown>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
export type SwipeAdsCategory = typeof swipeAdsCategories.$inferSelect;
export type NewSwipeAdsCategory = typeof swipeAdsCategories.$inferInsert;
export type SwipeAd = typeof swipeAds.$inferSelect;
export type NewSwipeAd = typeof swipeAds.$inferInsert;
export type GoogleCreative = typeof googleCreatives.$inferSelect;
export type Advertiser = typeof advertisers.$inferSelect;
export type NewAdvertiser = typeof advertisers.$inferInsert;
export type AdvertiserChannel = typeof advertiserChannels.$inferSelect;
export type NewAdvertiserChannel = typeof advertiserChannels.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type AuthorProfile = typeof authorsProfiles.$inferSelect;
export type NewAuthorProfile = typeof authorsProfiles.$inferInsert;
export type AuthorProfileLink = typeof authorsProfileLinks.$inferSelect;
export type NewAuthorProfileLink = typeof authorsProfileLinks.$inferInsert;
export type AuthorSyncConfig = typeof authorSyncConfigs.$inferSelect;
export type NewAuthorSyncConfig = typeof authorSyncConfigs.$inferInsert;
export type AdDetail = typeof adDetails.$inferSelect;
export type NewAdDetail = typeof adDetails.$inferInsert;
export type LinkedinCompanySearch = typeof linkedinCompanySearches.$inferSelect;
export type NewLinkedinCompanySearch =
  typeof linkedinCompanySearches.$inferInsert;
export type MetaCompany = typeof metaCompanies.$inferSelect;
export type NewMetaCompany = typeof metaCompanies.$inferInsert;
export type LinkedinCompany = typeof linkedinCompanies.$inferSelect;
export type NewLinkedinCompany = typeof linkedinCompanies.$inferInsert;
