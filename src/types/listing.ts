import type { listings } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Listing = InferSelectModel<typeof listings>;
export type NewListing = InferInsertModel<typeof listings>;

export type ListingWithDistance = Listing & {
  distanceKm?: number;
  relevanceScore?: number;
};

export type SearchParams = {
  q?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: "room" | "apartment" | "pg" | "hostel";
  lat?: number;
  lng?: number;
  radius?: number;
  near?: string; // POI id
  cursor?: string;
  limit?: number;
};
