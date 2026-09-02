import { MobileFilterSheet } from "@/components/search/MobileFilterSheet";
import { MobileSearchBar } from "@/components/search/MobileSearchBar";
import { SearchResultsMap } from "@/components/search/SearchResultsMap";
import { listings } from "@/lib/db/schema";
import { withAnon } from "@/lib/db/rls";
import { and, eq, gte, lte, or, ilike, desc } from "drizzle-orm";
import { SearchX } from "lucide-react";

export const metadata = { title: "Search rooms — NayaGhar" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;

  // Fetch here (server) so both the list and the map get the same result set.
  const conditions = [eq(listings.isActive, true)];
  if (params.q) {
    const term = `%${params.q}%`;
    conditions.push(or(ilike(listings.title, term), ilike(listings.description, term), ilike(listings.city, term), ilike(listings.neighborhood, term))!);
  }
  if (params.city) conditions.push(ilike(listings.city, params.city));
  if (params.minPrice) conditions.push(gte(listings.priceMonthly, Number(params.minPrice)));
  if (params.maxPrice) conditions.push(lte(listings.priceMonthly, Number(params.maxPrice)));
  if (params.type) conditions.push(eq(listings.propertyType, params.type as "room" | "apartment" | "pg" | "hostel"));

  const results = await withAnon(async (tx) =>
    tx.select().from(listings).where(and(...conditions)).orderBy(desc(listings.createdAt)).limit(50)
  );

  const searchedLabel = params.q ? (
    <>Searched for <span className="font-semibold text-[var(--ink)]">&ldquo;{params.q}&rdquo;</span></>
  ) : params.city ? (
    <>Rooms in <span className="font-semibold text-[var(--ink)]">{params.city}</span></>
  ) : (
    "Browse all rooms"
  );

  return (
    <div className="min-h-screen">
      {/* Mobile search bar */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:hidden pt-4">
        <MobileSearchBar defaultQuery={params.q || ""} defaultCity={params.city || ""} />
      </div>

      <div className="pt-5 lg:pt-6">
        {results.length === 0 ? (
          <div className="mx-auto max-w-7xl px-5 sm:px-8 pb-16">
            <div className="flex flex-col items-center justify-center py-20 text-center border border-[var(--line)] rounded-[var(--radius-lg)] bg-[var(--panel)]">
              <div className="w-14 h-14 rounded-[var(--radius)] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center mb-4">
                <SearchX className="w-6 h-6 text-[var(--ink-3)]" />
              </div>
              <p className="font-display text-lg font-bold text-[var(--ink)]">No rooms match yet</p>
              <p className="text-sm text-[var(--ink-2)] mt-1 max-w-xs">Try removing a filter or searching a different city.</p>
            </div>
          </div>
        ) : (
          <SearchResultsMap listings={results} header={searchedLabel} count={results.length} />
        )}
      </div>

      {/* Mobile filter floating button + sheet */}
      <MobileFilterSheet defaultQuery={params.q || ""} defaultCity={params.city || ""} />
    </div>
  );
}
