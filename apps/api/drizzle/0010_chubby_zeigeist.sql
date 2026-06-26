CREATE TABLE "meta_companies" (
	"page_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"logo" text,
	"likes" integer,
	"ig_username" text,
	"ig_followers" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
