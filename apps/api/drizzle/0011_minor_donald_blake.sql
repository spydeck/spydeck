CREATE TABLE "linkedin_companies" (
	"company_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"url" text,
	"industry" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
