import { Suspense } from "react";
import Link from "next/link";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { MobileFilterSheet } from "@/components/search/MobileFilterSheet";
import { MobileSearchBar } from "@/components/search/MobileSearchBar";
import { SearchResults, SearchResultsSkeleton } from "@/components/search/SearchResults";
import { X } from "lucide-react";

export const metadata = { title: "Search rooms — NayaGhar" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);
  const hasFilters = params.city || params.type || params.minPrice || params.maxPrice || params.q;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b-2 border-[var(--ink)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex items-end justify-between gap-4">
          <div>
            <p className="label text-[var(--brick)]">Search</p>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Find your room
            </h1>
          </div>
          {hasFilters && (
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius)] text-[13px] font-semibold text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger-wash)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Mobile search bar */}
        <div className="lg:hidden pt-4">
          <MobileSearchBar defaultQuery={params.q || ""} defaultCity={params.city || ""} />
        </div>

        <div className="flex gap-8 pt-5 lg:pt-8 pb-16">
          {/* Left sidebar — desktop only */}
          <aside className="hidden lg:block w-[248px] flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar defaultQuery={params.q || ""} defaultCity={params.city || ""} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense key={suspenseKey} fallback={<SearchResultsSkeleton />}>
              <SearchResults searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile filter floating button + sheet */}
      <MobileFilterSheet defaultQuery={params.q || ""} defaultCity={params.city || ""} />
    </div>
  );
}
