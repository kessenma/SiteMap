CREATE TABLE "push_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"platform" text NOT NULL,
	"token" text NOT NULL,
	"environment" text DEFAULT 'prod' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" text,
	"device_model" text,
	"app_version" text,
	"build_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "map_markers" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maps" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "passkey_credentials" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "two_factors" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_push_devices_user_active" ON "push_devices" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_push_devices_token" ON "push_devices" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "push_devices_token_platform_env_unique" ON "push_devices" USING btree ("token","platform","environment");