import { ListingCard } from "@/components/listing/ListingCard";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { and, eq, gte, lte, or, ilike } from "drizzle-orm";
import { Search as SearchIcon } from "lucide-react";

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

  const results = await getDb().select().from(listings).where(and(...conditions)).orderBy(listings.createdAt).limit(50);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-[var(--text-muted)]">
          <span className="text-white font-semibold">{results.length}</span> {results.length === 1 ? "property" : "properties"}
          {searchParams.q && <span className="ml-1">for &ldquo;<span className="text-white">{searchParams.q}</span>&rdquo;</span>}
          {searchParams.city && <span className="ml-1">in <span className="text-white">{searchParams.city}</span></span>}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
            <SearchIcon className="w-7 h-7 text-white/10" />
          </div>
          <p className="text-lg font-bold">No properties found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">Try removing some filters or searching in a different city</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
      <div className="h-4 w-32 rounded animate-shimmer mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
            <div className="h-56 animate-shimmer" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-3/4 rounded animate-shimmer" />
              <div className="h-3 w-1/2 rounded animate-shimmer" />
              <div className="pt-2 border-t border-white/[0.04]">
                <div className="h-5 w-24 rounded animate-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
