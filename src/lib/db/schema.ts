import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  smallint,
  doublePrecision,
  decimal,
  date,
  timestamp,
  pgEnum,
  jsonb,
  index,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "tenant",
  "landlord",
  "admin",
]);

export const propertyTypeEnum = pgEnum("property_type", [
  "room",
  "apartment",
  "pg",
  "hostel",
]);

export const poiCategoryEnum = pgEnum("poi_category", [
  "university",
  "transit",
  "hospital",
  "market",
  "office_hub",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "initiated",
  "active",
  "closed",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "esewa",
  "khalti",
]);

export const paymentDirectionEnum = pgEnum("payment_direction", [
  "deposit_in",
  "payout_out",
  "refund_out",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "settled",
  "failed",
  "refunded",
]);

export const escrowStateEnum = pgEnum("escrow_state", [
  "pending_fiat",
  "fiat_settled",
  "funded",
  "released",
  "refunded",
  "disputed",
  "resolved",
  "failed",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "dead",
]);

export const attestationKindEnum = pgEnum("attestation_kind", [
  "lease",
  "move_in",
  "move_out",
  "review",
  "guarantor_vouch",
]);

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: varchar("phone", { length: 20 }).unique(),
  email: varchar("email", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("tenant"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default("0"),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isIdVerified: boolean("is_id_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custodial Solana wallet, envelope-encrypted secret key.
// One per user. publicKey is exposed; encryptedSecretKey never leaves the server.
export const userWallets = pgTable("user_wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  publicKey: varchar("public_key", { length: 44 }).notNull().unique(),
  encryptedSecretKey: text("encrypted_secret_key").notNull(),
  iv: varchar("iv", { length: 32 }).notNull(),
  authTag: varchar("auth_tag", { length: 32 }).notNull(),
  dekWrapped: text("dek_wrapped").notNull(),
  kekId: varchar("kek_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rotatedAt: timestamp("rotated_at"),
});

// Listings
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    landlordId: uuid("landlord_id")
      .references(() => users.id)
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    priceMonthly: integer("price_monthly").notNull(),
    deposit: integer("deposit"),
    propertyType: propertyTypeEnum("property_type").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    neighborhood: varchar("neighborhood", { length: 100 }),
    amenities: jsonb("amenities").$type<Record<string, boolean>>().default({}),
    photos: jsonb("photos")
      .$type<{ url: string; order: number; alt?: string }[]>()
      .default([]),
    videos: jsonb("videos")
      .$type<{ url: string; thumbnail?: string; duration?: number }[]>()
      .default([]),
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),
    availableFrom: date("available_from"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("listings_city_price_idx").on(
      table.city,
      table.priceMonthly,
      table.isActive
    ),
    index("listings_location_idx").on(table.latitude, table.longitude),
  ]
);

// Reviews
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .references(() => listings.id)
    .notNull(),
  reviewerId: uuid("reviewer_id")
    .references(() => users.id)
    .notNull(),
  rating: smallint("rating").notNull(),
  text: text("text"),
  isVerifiedStay: boolean("is_verified_stay").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Points of Interest
export const pois = pgTable("pois", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: poiCategoryEnum("category").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
});

// Conversations (WhatsApp tracking)
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .references(() => listings.id)
    .notNull(),
  tenantId: uuid("tenant_id")
    .references(() => users.id)
    .notNull(),
  landlordId: uuid("landlord_id")
    .references(() => users.id)
    .notNull(),
  whatsappThreadId: varchar("whatsapp_thread_id", { length: 255 }),
  status: conversationStatusEnum("status").default("initiated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Locked rate quote: SOL/NPR composed from Pyth SOL/USD + forex USD/NPR.
// Consumed at most once when funding an escrow.
export const priceQuotes = pgTable(
  "price_quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    solUsdMicros: bigint("sol_usd_micros", { mode: "number" }).notNull(),
    usdNprMicros: bigint("usd_npr_micros", { mode: "number" }).notNull(),
    solNprMicros: bigint("sol_npr_micros", { mode: "number" }).notNull(),
    pythPublishTime: timestamp("pyth_publish_time").notNull(),
    pythConfBps: integer("pyth_conf_bps").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("price_quotes_user_idx").on(t.userId, t.expiresAt)]
);

// Escrow record. Mirrors on-chain state, also tracks the off-chain fiat phases.
export const escrows = pgTable(
  "escrows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .references(() => listings.id)
      .notNull(),
    tenantId: uuid("tenant_id")
      .references(() => users.id)
      .notNull(),
    landlordId: uuid("landlord_id")
      .references(() => users.id)
      .notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    amountLamports: bigint("amount_lamports", { mode: "number" }),
    quoteId: uuid("quote_id").references(() => priceQuotes.id),
    pdaAddress: varchar("pda_address", { length: 44 }),
    fundTxSig: varchar("fund_tx_sig", { length: 128 }),
    releaseTxSig: varchar("release_tx_sig", { length: 128 }),
    refundTxSig: varchar("refund_tx_sig", { length: 128 }),
    state: escrowStateEnum("state").notNull().default("pending_fiat"),
    moveInDate: date("move_in_date"),
    moveOutDate: date("move_out_date"),
    releasePolicy: jsonb("release_policy").$type<{
      landlordPaisa: number;
      tenantPaisa: number;
      reason?: string;
    }>(),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("escrows_tenant_idx").on(t.tenantId, t.state),
    index("escrows_landlord_idx").on(t.landlordId, t.state),
    index("escrows_listing_idx").on(t.listingId),
  ]
);

// All fiat in/out, both providers, both directions.
export const fiatPayments = pgTable(
  "fiat_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    escrowId: uuid("escrow_id").references(() => escrows.id),
    provider: paymentProviderEnum("provider").notNull(),
    direction: paymentDirectionEnum("direction").notNull(),
    amountPaisa: integer("amount_paisa").notNull(),
    providerRef: varchar("provider_ref", { length: 255 }).notNull().unique(),
    providerStatus: varchar("provider_status", { length: 50 }),
    status: paymentStatusEnum("status").notNull().default("pending"),
    rawResponse: jsonb("raw_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    settledAt: timestamp("settled_at"),
  },
  (t) => [
    index("fiat_user_status_idx").on(t.userId, t.status),
    index("fiat_escrow_idx").on(t.escrowId),
  ]
);

/**
 * Attestations: verifiable signed records of rental milestones.
 *
 * Pattern: off-chain document (PDF, photo set, review text) → sha256 hash →
 * ed25519-signed by the relevant parties' custodial wallets → optionally
 * anchored on Solana via the Memo program for permanence. Anyone can verify
 * by re-hashing the off-chain document and checking signatures against the
 * stored wallet pubkeys.
 *
 * One table, polymorphic by `kind`. The semantic shape per kind:
 *   lease            primary=tenant, counter=landlord, escrow_ref required
 *   move_in          primary=tenant, counter=landlord, escrow_ref required
 *   move_out         primary=tenant, counter=landlord, escrow_ref required
 *   review           primary=reviewer, no counter, escrow_ref required (verified-stay)
 *   guarantor_vouch  primary=guarantor, no counter, subject is the tenant
 */
export const attestations = pgTable(
  "attestations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: attestationKindEnum("kind").notNull(),

    // Whose record this attestation belongs to (rendered on their Passport).
    subjectUserId: uuid("subject_user_id")
      .references(() => users.id)
      .notNull(),

    // sha256 of the structured payload below (hex). Re-derivable client-side.
    documentHash: varchar("document_hash", { length: 64 }).notNull(),

    // The off-chain artifact (PDF, photo set, etc.) — Cloudinary URL or null.
    documentUrl: text("document_url"),

    // Structured data the hash covers — terms, photo URLs, checklist, etc.
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),

    // ed25519 signatures by custodial wallets, base58. Counter is optional
    // for single-signer kinds (review, guarantor_vouch).
    primarySignerPubkey: varchar("primary_signer_pubkey", { length: 44 }).notNull(),
    primarySignature: text("primary_signature").notNull(),
    counterSignerPubkey: varchar("counter_signer_pubkey", { length: 44 }),
    counterSignature: text("counter_signature"),

    // Cross-references for filtering / passport rendering.
    listingId: uuid("listing_id").references(() => listings.id),
    escrowId: uuid("escrow_id").references(() => escrows.id),

    // Solana Memo program anchor (set when published on-chain). The tx itself
    // is the proof; sig is what the verifier looks up.
    onchainTxSig: varchar("onchain_tx_sig", { length: 128 }),
    onchainSlot: bigint("onchain_slot", { mode: "number" }),

    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("attest_subject_kind_idx").on(t.subjectUserId, t.kind),
    index("attest_listing_idx").on(t.listingId),
    index("attest_escrow_idx").on(t.escrowId),
  ]
);

// Postgres-backed job queue. Cron endpoint pulls pending rows, marks running, runs handler,
// marks completed or fails with backoff. Avoids needing Redis for the hackathon.
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: varchar("kind", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAfter: timestamp("run_after").defaultNow().notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("jobs_status_runafter_idx").on(t.status, t.runAfter)]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  listings: many(listings),
  reviews: many(reviews),
  wallet: one(userWallets, {
    fields: [users.id],
    references: [userWallets.userId],
  }),
  escrowsAsTenant: many(escrows, { relationName: "tenant" }),
  escrowsAsLandlord: many(escrows, { relationName: "landlord" }),
}));

export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  user: one(users, {
    fields: [userWallets.userId],
    references: [users.id],
  }),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  landlord: one(users, {
    fields: [listings.landlordId],
    references: [users.id],
  }),
  reviews: many(reviews),
  escrows: many(escrows),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
  }),
}));

export const escrowsRelations = relations(escrows, ({ one, many }) => ({
  listing: one(listings, {
    fields: [escrows.listingId],
    references: [listings.id],
  }),
  tenant: one(users, {
    fields: [escrows.tenantId],
    references: [users.id],
    relationName: "tenant",
  }),
  landlord: one(users, {
    fields: [escrows.landlordId],
    references: [users.id],
    relationName: "landlord",
  }),
  quote: one(priceQuotes, {
    fields: [escrows.quoteId],
    references: [priceQuotes.id],
  }),
  payments: many(fiatPayments),
}));

export const fiatPaymentsRelations = relations(fiatPayments, ({ one }) => ({
  user: one(users, {
    fields: [fiatPayments.userId],
    references: [users.id],
  }),
  escrow: one(escrows, {
    fields: [fiatPayments.escrowId],
    references: [escrows.id],
  }),
}));

export const attestationsRelations = relations(attestations, ({ one }) => ({
  subject: one(users, {
    fields: [attestations.subjectUserId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [attestations.listingId],
    references: [listings.id],
  }),
  escrow: one(escrows, {
    fields: [attestations.escrowId],
    references: [escrows.id],
  }),
}));
