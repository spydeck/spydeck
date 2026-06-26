CREATE TYPE "public"."ad_platform" AS ENUM('linkedin', 'meta', 'tiktok', 'google');--> statement-breakpoint
CREATE TABLE "ad_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "ad_platform" NOT NULL,
	"external_id" text NOT NULL,
	"source_url" text,
	"detail" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_details_platform_external_id_unique" UNIQUE("platform","external_id")
);
