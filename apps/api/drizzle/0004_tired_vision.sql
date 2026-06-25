CREATE TABLE "author_sync_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"mode" text DEFAULT 'full' NOT NULL,
	"post_count" integer,
	"from_date" text,
	"to_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "author_sync_configs_author_id_platform_unique" UNIQUE("author_id","platform")
);
--> statement-breakpoint
ALTER TABLE "author_sync_configs" ADD CONSTRAINT "author_sync_configs_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;