"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Listing } from "@/types/listing";

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full animate-shimmer rounded-[20px]" />
  ),
});

export function HomeMap({ listings }: { listings: Listing[] }) {
  const router = useRouter();

  const handleBoundsChange = useCallback(
    (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
      // Could be used to load more listings in viewport
      void bounds;
    },
    []
  );

  return (
    <MapView
      listings={listings}
      onBoundsChange={handleBoundsChange}
      initialCenter={{ lat: 28.3949, lng: 84.124, zoom: 7 }}
    />
  );
}
