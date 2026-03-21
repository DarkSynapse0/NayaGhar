"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types/listing";

// Lazy-load MapView to avoid shipping MapLibre JS on initial page load
const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">
      Loading map...
    </div>
  ),
});

interface SearchMapProps {
  listings: Listing[];
  onBoundsChange?: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
}

export function SearchMap({ listings, onBoundsChange }: SearchMapProps) {
  return <MapView listings={listings} onBoundsChange={onBoundsChange} />;
}
