CREATE TABLE "comment_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"file_uri" text DEFAULT '' NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_item_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_item_id" uuid NOT NULL,
	"file_uri" text DEFAULT '' NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"map_id" uuid NOT NULL,
	"x" real DEFAULT 0 NOT NULL,
	"y" real DEFAULT 0 NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_by" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"x" real DEFAULT 0 NOT NULL,
	"y" real DEFAULT 0 NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_by" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"map_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"map_id" uuid NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"stroke_width" real DEFAULT 2 NOT NULL,
	"path_data" text DEFAULT '[]' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teammates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"teammate_id" text NOT NULL,
	"role" text DEFAULT 'team_member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"facility_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "map_keys" ADD COLUMN "icon_type" text DEFAULT 'shape' NOT NULL;--> statement-breakpoint
ALTER TABLE "map_keys" ADD COLUMN "icon_text" text;--> statement-breakpoint
ALTER TABLE "map_keys" ADD COLUMN "marker_size" text DEFAULT 'md' NOT NULL;--> statement-breakpoint
ALTER TABLE "comment_photos" ADD CONSTRAINT "comment_photos_comment_id_map_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."map_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_map_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."map_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_comment_id_map_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."map_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_item_photos" ADD CONSTRAINT "list_item_photos_list_item_id_map_list_items_id_fk" FOREIGN KEY ("list_item_id") REFERENCES "public"."map_list_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_comments" ADD CONSTRAINT "map_comments_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_comments" ADD CONSTRAINT "map_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_comments" ADD CONSTRAINT "map_comments_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_list_items" ADD CONSTRAINT "map_list_items_list_id_map_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."map_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_list_items" ADD CONSTRAINT "map_list_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_lists" ADD CONSTRAINT "map_lists_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_lists" ADD CONSTRAINT "map_lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_paths" ADD CONSTRAINT "map_paths_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_paths" ADD CONSTRAINT "map_paths_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teammates" ADD CONSTRAINT "teammates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teammates" ADD CONSTRAINT "teammates_teammate_id_users_id_fk" FOREIGN KEY ("teammate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_facilities" ADD CONSTRAINT "user_facilities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_facilities" ADD CONSTRAINT "user_facilities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comment_photos_comment_id" ON "comment_photos" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_reactions_comment_id" ON "comment_reactions" USING btree ("comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_comment_reactions_unique" ON "comment_reactions" USING btree ("comment_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "idx_comment_replies_comment_id" ON "comment_replies" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_list_item_photos_list_item_id" ON "list_item_photos" USING btree ("list_item_id");--> statement-breakpoint
CREATE INDEX "idx_map_comments_map_id" ON "map_comments" USING btree ("map_id");--> statement-breakpoint
CREATE INDEX "idx_map_list_items_list_id" ON "map_list_items" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "idx_map_lists_map_id" ON "map_lists" USING btree ("map_id");--> statement-breakpoint
CREATE INDEX "idx_map_paths_map_id" ON "map_paths" USING btree ("map_id");--> statement-breakpoint
CREATE INDEX "idx_teammates_user_id" ON "teammates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teammates_teammate_id" ON "teammates" USING btree ("teammate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_teammates_unique" ON "teammates" USING btree ("user_id","teammate_id");--> statement-breakpoint
CREATE INDEX "idx_user_facilities_user_id" ON "user_facilities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_facilities_facility_id" ON "user_facilities" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_facilities_unique" ON "user_facilities" USING btree ("user_id","facility_id");