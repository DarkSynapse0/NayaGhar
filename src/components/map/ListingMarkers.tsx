"use client";

import { useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import useSupercluster from "use-supercluster";
import type { Listing } from "@/types/listing";

interface ListingMarkersProps {
  listings: Listing[];
  zoom: number;
  onListingClick?: (listing: Listing) => void;
  onClusterClick?: (longitude: number, latitude: number, expansionZoom: number) => void;
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
  onClusterClick,
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

  const { clusters, supercluster } = useSupercluster({
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
          const size = Math.min(42 + (pointCount / listings.length) * 30, 72);
          return (
            <Marker key={`cluster-${cluster.id}`} longitude={lng} latitude={lat}>
              <button
                type="button"
                aria-label={`${pointCount} listings, zoom in`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!supercluster || !onClusterClick) return;
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id as number),
                    18
                  );
                  onClusterClick(lng, lat, expansionZoom);
                }}
                className="rounded-full bg-[var(--brick)] text-white flex items-center justify-center font-display font-bold text-sm shadow-md border-2 border-[var(--panel)] hover:bg-[var(--brick-ink)] transition-colors"
                style={{ width: size, height: size }}
              >
                {pointCount}
              </button>
            </Marker>
          );
        }

        const listing = props.listing as Listing;
        return (
          <Marker key={`listing-${listing.id}`} longitude={lng} latitude={lat} anchor="bottom">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onListingClick?.(listing); }}
              className="price-display bg-[var(--panel)] text-[var(--brick)] font-bold text-xs px-2.5 py-1.5 rounded-[var(--radius)] shadow-md border border-[var(--ink)] hover:bg-[var(--brick)] hover:text-[var(--panel)] transition-colors whitespace-nowrap"
            >
              Rs {formatPrice(listing.priceMonthly)}
            </button>
          </Marker>
        );
      })}
    </>
  );
}
