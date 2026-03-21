CREATE TYPE "public"."conversation_status" AS ENUM('initiated', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."poi_category" AS ENUM('university', 'transit', 'hospital', 'market', 'office_hub');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('room', 'apartment', 'pg', 'hostel');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('tenant', 'landlord', 'admin');--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"landlord_id" uuid NOT NULL,
	"whatsapp_thread_id" varchar(255),
	"status" "conversation_status" DEFAULT 'initiated',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"embedding" vector(1536),
	"price_monthly" integer NOT NULL,
	"deposit" integer,
	"property_type" "property_type" NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"neighborhood" varchar(100),
	"amenities" jsonb DEFAULT '{}'::jsonb,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"available_from" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pois" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "poi_category" NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"city" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"text" text,
	"is_verified_stay" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'tenant' NOT NULL,
	"avatar_url" varchar(500),
	"trust_score" numeric(5, 2) DEFAULT '0',
	"is_phone_verified" boolean DEFAULT false,
	"is_id_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_city_price_idx" ON "listings" USING btree ("city","price_monthly","is_active");--> statement-breakpoint
CREATE INDEX "listings_location_idx" ON "listings" USING btree ("latitude","longitude");