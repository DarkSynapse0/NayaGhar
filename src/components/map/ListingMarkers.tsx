"use client";

import { useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import useSupercluster from "use-supercluster";
import type { Listing } from "@/types/listing";

interface ListingMarkersProps {
  listings: Listing[];
  zoom: number;
  onListingClick?: (listing: Listing) => void;
}

function formatPrice(paisa: number): string {
  const rupees = paisa / 100;
  if (rupees >= 100000) return `${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `${(rupees / 1000).toFixed(0)}K`;
  return `${rupees}`;
}

export function ListingMarkers({
  listings,
  zoom,
  onListingClick,
}: ListingMarkersProps) {
  const points = useMemo(
    () =>
      listings.map((listing) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          listingId: listing.id,
          price: listing.priceMonthly,
          title: listing.title,
          listing,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [listing.longitude, listing.latitude],
        },
      })),
    [listings]
  );

  const bounds: [number, number, number, number] = useMemo(() => {
    if (points.length === 0) return [-180, -90, 180, 90];
    const lngs = points.map((p) => p.geometry.coordinates[0]);
    const lats = points.map((p) => p.geometry.coordinates[1]);
    return [
      Math.min(...lngs) - 1,
      Math.min(...lats) - 1,
      Math.max(...lngs) + 1,
      Math.max(...lats) + 1,
    ];
  }, [points]);

  const { clusters } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 17 },
  });

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const props = cluster.properties as Record<string, unknown>;
        const isCluster = props.cluster as boolean;
        const pointCount = (props.point_count as number) || 0;

        if (isCluster) {
          const size = Math.min(40 + (pointCount / listings.length) * 30, 70);
          return (
            <Marker key={`cluster-${cluster.id}`} longitude={lng} latitude={lat}>
              <div
                className="rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white"
                style={{ width: size, height: size }}
              >
                {pointCount}
              </div>
            </Marker>
          );
        }

        const listing = props.listing as Listing;
        return (
          <Marker
            key={`listing-${listing.id}`}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
          >
            <button
              onClick={() => onListingClick?.(listing)}
              className="bg-white text-primary font-bold text-xs px-2 py-1 rounded-lg shadow-md border border-border hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
            >
              {formatPrice(listing.priceMonthly)}
            </button>
          </Marker>
        );
      })}
    </>
  );
}
