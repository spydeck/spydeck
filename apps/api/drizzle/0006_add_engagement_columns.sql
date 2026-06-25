ALTER TABLE "posts" ADD COLUMN "likes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "shares" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "comments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "posts" SET
  "likes" = COALESCE(("engagement"->>'likes')::int, 0),
  "views" = COALESCE(("engagement"->>'views')::int, 0),
  "shares" = COALESCE(("engagement"->>'shares')::int, 0),
  "comments" = COALESCE(("engagement"->>'comments')::int, 0)
WHERE "engagement" IS NOT NULL;