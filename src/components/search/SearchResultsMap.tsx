"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { ListingCard } from "@/components/listing/ListingCard";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { FilterBar } from "@/components/search/FilterBar";
import type { Listing } from "@/types/listing";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-shimmer" />,
});

const NEPAL = { lat: 28.3949, lng: 84.124, zoom: 7 };

/**
 * Browse results with a Grid / Map toggle.
 *  - Grid: fixed left filter sidebar + full card grid.
 *  - Map:  compact top filter bar + fixed-height split (cards scroll, map fixed, 40/60).
 */
export function SearchResultsMap({
  listings,
  header,
  count,
}: {
  listings: Listing[];
  header?: React.ReactNode;
  count: number;
}) {
  const [view, setView] = useState<"grid" | "map">("grid");
  const [nonce, setNonce] = useState(0);

  useEffect(() => { setNonce((n) => n + 1); }, [listings, view]);

  const focus = useMemo(() => {
    if (!listings.length) return null;
    const lats = listings.map((l) => l.latitude);
    const lngs = listings.map((l) => l.longitude);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    if (minLat === maxLat) { minLat -= 0.01; maxLat += 0.01; }
    if (minLng === maxLng) { minLng -= 0.01; maxLng += 0.01; }
    return { minLat, maxLat, minLng, maxLng, nonce };
  }, [listings, nonce]);

  const cards = listings.map((l) => <ListingCard key={l.id} listing={l} />);

  const toggleBtn = (mode: "grid" | "map", Icon: typeof LayoutGrid, label: string, borderLeft = false) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-semibold transition-colors ${borderLeft ? "border-l border-[var(--ink)]" : ""} ${
        view === mode ? "bg-[var(--brick)] text-[var(--panel)]" : "bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--paper-2)]"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className={`mx-auto max-w-none px-4 sm:px-6 lg:px-8 ${view === "map" ? "lg:h-[calc(100vh-9rem)] lg:flex lg:flex-col lg:overflow-hidden" : "lg:h-[calc(100vh-5rem)] lg:flex lg:flex-col lg:overflow-hidden pb-16 lg:pb-0"}`}>
      {/* Map mode: compact filter bar at the top */}
      {view === "map" && (
        <div className="hidden lg:block mb-4 shrink-0">
          <FilterBar />
        </div>
      )}

      {/* Summary row (fixed at top of the locked view): searched-for label · count + toggle */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--line)] shrink-0">
        <p className="text-sm text-[var(--ink-2)] truncate min-w-0">{header}</p>
        <div className="flex items-center gap-4 shrink-0">
          <p className="text-sm text-[var(--ink-2)] hidden sm:block">
            <span className="price-display font-bold text-[var(--ink)] text-base">{count}</span>{" "}
            {count === 1 ? "room" : "rooms"}
          </p>
          <div className="inline-flex rounded-[var(--radius)] border border-[var(--ink)] overflow-hidden">
            {toggleBtn("grid", LayoutGrid, "Grid")}
            {toggleBtn("map", MapIcon, "Map", true)}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        /* Grid: fixed sidebar + full card grid */
        <div className="lg:flex-1 lg:min-h-0 lg:flex lg:gap-8">
          <aside className="hidden lg:block w-[240px] flex-shrink-0 lg:h-full lg:overflow-y-auto no-scrollbar pr-1">
            <FilterSidebar />
          </aside>
          <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">{cards}</div>
          </div>
        </div>
      ) : (
        /* Map: full-width map (results shown as pins) */
        <div className="lg:flex-1 lg:min-h-0">
          <div className="h-[70vh] lg:h-full rounded-[var(--radius-lg)] overflow-hidden border-2 border-[var(--ink)]">
            <MapView listings={listings} focus={focus} initialCenter={NEPAL} />
          </div>
        </div>
      )}
    </div>
  );
}
