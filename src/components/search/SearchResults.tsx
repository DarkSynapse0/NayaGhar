import { ListingCard } from "@/components/listing/ListingCard";
import { listings } from "@/lib/db/schema";
import { withAnon } from "@/lib/db/rls";
import { and, eq, gte, lte, or, ilike, desc } from "drizzle-orm";
import { SearchX } from "lucide-react";

export async function SearchResults({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const conditions = [eq(listings.isActive, true)];
  if (searchParams.q) {
    const term = `%${searchParams.q}%`;
    conditions.push(or(ilike(listings.title, term), ilike(listings.description, term), ilike(listings.city, term), ilike(listings.neighborhood, term))!);
  }
  if (searchParams.city) conditions.push(ilike(listings.city, searchParams.city));
  if (searchParams.minPrice) conditions.push(gte(listings.priceMonthly, Number(searchParams.minPrice)));
  if (searchParams.maxPrice) conditions.push(lte(listings.priceMonthly, Number(searchParams.maxPrice)));
  if (searchParams.type) conditions.push(eq(listings.propertyType, searchParams.type as "room" | "apartment" | "pg" | "hostel"));

  const results = await withAnon(async (tx) =>
    tx.select().from(listings).where(and(...conditions)).orderBy(desc(listings.createdAt)).limit(50)
  );

  return (
    <>
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--line)]">
        <p className="text-sm text-[var(--ink-2)]">
          <span className="price-display text-[var(--ink)] font-bold text-base">{results.length}</span>{" "}
          {results.length === 1 ? "room" : "rooms"}
          {searchParams.q && <span className="ml-1">for &ldquo;<span className="text-[var(--ink)] font-medium">{searchParams.q}</span>&rdquo;</span>}
          {searchParams.city && <span className="ml-1">in <span className="text-[var(--ink)] font-medium">{searchParams.city}</span></span>}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[var(--line)] rounded-[var(--radius-lg)] bg-[var(--panel)]">
          <div className="w-14 h-14 rounded-[var(--radius)] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center mb-4">
            <SearchX className="w-6 h-6 text-[var(--ink-3)]" />
          </div>
          <p className="font-display text-lg font-bold text-[var(--ink)]">No rooms match yet</p>
          <p className="text-sm text-[var(--ink-2)] mt-1 max-w-xs">Try removing a filter or searching a different city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </>
  );
}

export function SearchResultsSkeleton() {
  return (
    <>
      <div className="h-8 w-40 rounded bg-[var(--paper-2)] mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--paper-2)] animate-pulse-soft" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-24 rounded bg-[var(--paper-2)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--paper-2)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--paper-2)]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
