import { Suspense } from "react";
import Link from "next/link";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { MobileFilterSheet } from "@/components/search/MobileFilterSheet";
import { MobileSearchBar } from "@/components/search/MobileSearchBar";
import { SearchResults, SearchResultsSkeleton } from "@/components/search/SearchResults";
import { X } from "lucide-react";

export const metadata = { title: "Search Properties - NayaGhar" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);
  const hasFilters = params.city || params.type || params.minPrice || params.maxPrice || params.q;

  return (
    <div className="min-h-screen px-5 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Mobile header + search bar */}
        <div className="lg:hidden pt-6 pb-3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-2">Search</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Find Your<br /><span className="text-white/30">Space.</span>
              </h1>
            </div>
            {hasFilters && (
              <Link
                href="/search"
                className="flex items-center gap-1.5 mt-1 h-8 px-3 rounded-lg text-xs font-semibold text-red-400/60 hover:text-red-400 border border-red-500/[0.08] hover:bg-red-500/[0.06] transition-all"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </Link>
            )}
          </div>
          <MobileSearchBar defaultQuery={params.q || ""} defaultCity={params.city || ""} />
        </div>

        <div className="flex gap-8 pt-2 lg:pt-6 pb-16">
          {/* Left sidebar — desktop only */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
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
