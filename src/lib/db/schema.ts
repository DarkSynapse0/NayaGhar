import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  reviews: many(reviews),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  landlord: one(users, {
    fields: [listings.landlordId],
    references: [users.id],
  }),
  reviews: many(reviews),
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
