"use client";

import { useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import useSupercluster from "use-supercluster";
import { Home } from "lucide-react";
import type { Listing } from "@/types/listing";

interface ListingMarkersProps {
  listings: Listing[];
  zoom: number;
  onListingClick?: (listing: Listing) => void;
  onClusterClick?: (longitude: number, latitude: number, expansionZoom: number) => void;
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
              aria-label={listing.title}
              onClick={(e) => { e.stopPropagation(); onListingClick?.(listing); }}
              className="group flex flex-col items-center"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--brick)] text-white border-2 border-[var(--panel)] shadow-md group-hover:bg-[var(--brick-ink)] transition-colors">
                <Home className="w-4 h-4" />
              </span>
              <span className="-mt-1 w-2.5 h-2.5 rotate-45 bg-[var(--brick)] border-r-2 border-b-2 border-[var(--panel)] group-hover:bg-[var(--brick-ink)] transition-colors" />
            </button>
          </Marker>
        );
      })}
    </>
  );
}
