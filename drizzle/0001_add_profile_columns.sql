ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" varchar(120);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "bio" TYPE varchar(500);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"country" varchar(100),
	"device" varchar(50),
	"browser" varchar(50),
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profile_views_profile_id_idx" ON "profile_views" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profile_views_created_at_idx" ON "profile_views" USING btree ("created_at");
