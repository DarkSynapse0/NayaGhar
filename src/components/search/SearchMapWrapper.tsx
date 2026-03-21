"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types/listing";

// Lazy-load the map to keep initial JS minimal (low-bandwidth target)
const SearchMap = dynamic(
  () => import("@/components/map/SearchMap").then((m) => m.SearchMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">
        Loading map...
      </div>
    ),
  }
);

export function SearchMapWrapper({ listings }: { listings: Listing[] }) {
  return <SearchMap listings={listings} />;
}
