CREATE TABLE "google_creatives" (
	"creative_id" text PRIMARY KEY NOT NULL,
	"advertiser_id" text,
	"format" text,
	"video_url" text,
	"image_url" text,
	"headline" text,
	"click_url" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
