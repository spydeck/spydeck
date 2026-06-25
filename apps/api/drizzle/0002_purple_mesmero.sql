CREATE TABLE "authors_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"handle" text NOT NULL,
	"profile" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_profiles_author_id_platform_unique" UNIQUE("author_id","platform")
);
--> statement-breakpoint
ALTER TABLE "authors_profiles" ADD CONSTRAINT "authors_profiles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;