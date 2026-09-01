CREATE TYPE "public"."escrow_state" AS ENUM('pending_fiat', 'fiat_settled', 'funded', 'released', 'refunded', 'disputed', 'resolved', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."payment_direction" AS ENUM('deposit_in', 'payout_out', 'refund_out');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('esewa', 'khalti');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'settled', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "escrows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"landlord_id" uuid NOT NULL,
	"amount_paisa" integer NOT NULL,
	"amount_lamports" bigint NOT NULL,
	"quote_id" uuid NOT NULL,
	"pda_address" varchar(44),
	"fund_tx_sig" varchar(128),
	"release_tx_sig" varchar(128),
	"refund_tx_sig" varchar(128),
	"state" "escrow_state" DEFAULT 'pending_fiat' NOT NULL,
	"move_in_date" date,
	"move_out_date" date,
	"release_policy" jsonb,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiat_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"escrow_id" uuid,
	"provider" "payment_provider" NOT NULL,
	"direction" "payment_direction" NOT NULL,
	"amount_paisa" integer NOT NULL,
	"provider_ref" varchar(255) NOT NULL,
	"provider_status" varchar(50),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"settled_at" timestamp,
	CONSTRAINT "fiat_payments_provider_ref_unique" UNIQUE("provider_ref")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sol_usd_micros" bigint NOT NULL,
	"usd_npr_micros" bigint NOT NULL,
	"sol_npr_micros" bigint NOT NULL,
	"pyth_publish_time" timestamp NOT NULL,
	"pyth_conf_bps" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"public_key" varchar(44) NOT NULL,
	"encrypted_secret_key" text NOT NULL,
	"iv" varchar(32) NOT NULL,
	"auth_tag" varchar(32) NOT NULL,
	"dek_wrapped" text NOT NULL,
	"kek_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rotated_at" timestamp,
	CONSTRAINT "user_wallets_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_wallets_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_quote_id_price_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."price_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiat_payments" ADD CONSTRAINT "fiat_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiat_payments" ADD CONSTRAINT "fiat_payments_escrow_id_escrows_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_quotes" ADD CONSTRAINT "price_quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "escrows_tenant_idx" ON "escrows" USING btree ("tenant_id","state");--> statement-breakpoint
CREATE INDEX "escrows_landlord_idx" ON "escrows" USING btree ("landlord_id","state");--> statement-breakpoint
CREATE INDEX "escrows_listing_idx" ON "escrows" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "fiat_user_status_idx" ON "fiat_payments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "fiat_escrow_idx" ON "fiat_payments" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "jobs_status_runafter_idx" ON "jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "price_quotes_user_idx" ON "price_quotes" USING btree ("user_id","expires_at");