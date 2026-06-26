CREATE TYPE "public"."advertiser_platform" AS ENUM('linkedin', 'meta', 'google', 'tiktok');--> statement-breakpoint
CREATE TABLE "advertiser_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" uuid NOT NULL,
	"platform" "advertiser_platform" NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advertiser_channels_advertiser_platform_unique" UNIQUE("advertiser_id","platform")
);
--> statement-breakpoint
ALTER TABLE "advertisers" DROP CONSTRAINT "advertisers_platform_external_id_unique";--> statement-breakpoint
ALTER TABLE "advertiser_channels" ADD CONSTRAINT "advertiser_channels_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisers" DROP COLUMN "platform";--> statement-breakpoint
ALTER TABLE "advertisers" DROP COLUMN "external_id";--> statement-breakpoint
ALTER TABLE "advertisers" DROP COLUMN "url";