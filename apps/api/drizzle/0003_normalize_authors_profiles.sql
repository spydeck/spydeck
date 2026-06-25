-- Normalize authors_profiles: replace opaque jsonb `profile` blob with typed columns.
-- Add authors_profile_links child table for repeating link groups (1NF).

ALTER TABLE "authors_profiles" DROP COLUMN "profile";

ALTER TABLE "authors_profiles"
  ADD COLUMN "platform_id"          text,
  ADD COLUMN "display_name"         text,
  ADD COLUMN "avatar_url"           text,
  ADD COLUMN "bio"                  text,
  ADD COLUMN "external_url"         text,
  ADD COLUMN "follower_count"       integer,
  ADD COLUMN "following_count"      integer,
  ADD COLUMN "verified"             boolean,
  ADD COLUMN "tiktok_like_count"    integer,
  ADD COLUMN "tiktok_video_count"   integer,
  ADD COLUMN "ig_is_private"        boolean,
  ADD COLUMN "ig_is_business_account" boolean,
  ADD COLUMN "ig_category_name"     text,
  ADD COLUMN "yt_country"           text,
  ADD COLUMN "yt_email"             text,
  ADD COLUMN "yt_joined_date"       text,
  ADD COLUMN "x_location"           text,
  ADD COLUMN "x_tweet_count"        integer,
  ADD COLUMN "raw"                  jsonb;
--> statement-breakpoint

CREATE TABLE "authors_profile_links" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id"  uuid NOT NULL REFERENCES "authors_profiles"("id") ON DELETE cascade,
  "url"         text NOT NULL,
  "title"       text,
  "sort_order"  integer NOT NULL DEFAULT 0
);
--> statement-breakpoint

CREATE INDEX "authors_profile_links_profile_id_idx"
  ON "authors_profile_links" ("profile_id");
