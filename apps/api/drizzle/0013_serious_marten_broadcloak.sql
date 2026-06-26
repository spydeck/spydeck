CREATE TABLE "swipe_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" text NOT NULL,
	"ad" jsonb NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "swipe_ads_ad_id_unique" UNIQUE("ad_id")
);
--> statement-breakpoint
ALTER TABLE "swipe_ads" ADD CONSTRAINT "swipe_ads_category_id_swipe_ads_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."swipe_ads_categories"("id") ON DELETE set null ON UPDATE no action;