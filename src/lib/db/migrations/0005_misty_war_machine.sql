CREATE TYPE "public"."attestation_kind" AS ENUM('lease', 'move_in', 'move_out', 'review', 'guarantor_vouch');--> statement-breakpoint
CREATE TABLE "attestations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "attestation_kind" NOT NULL,
	"subject_user_id" uuid NOT NULL,
	"document_hash" varchar(64) NOT NULL,
	"document_url" text,
	"payload" jsonb NOT NULL,
	"primary_signer_pubkey" varchar(44) NOT NULL,
	"primary_signature" text NOT NULL,
	"counter_signer_pubkey" varchar(44),
	"counter_signature" text,
	"listing_id" uuid,
	"escrow_id" uuid,
	"onchain_tx_sig" varchar(128),
	"onchain_slot" bigint,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_escrow_id_escrows_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attest_subject_kind_idx" ON "attestations" USING btree ("subject_user_id","kind");--> statement-breakpoint
CREATE INDEX "attest_listing_idx" ON "attestations" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "attest_escrow_idx" ON "attestations" USING btree ("escrow_id");