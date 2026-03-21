"use client";

import { useCallback, useRef, useState } from "react";
import Map, { NavigationControl, Popup, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { ListingMarkers } from "./ListingMarkers";
import { Badge } from "@/components/ui/Badge";
import type { Listing } from "@/types/listing";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Default center: Nepal
const DEFAULT_VIEW = {
  latitude: 28.3949,
  longitude: 84.1240,
  zoom: 7,
};

function formatPrice(paisa: number): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(paisa / 100);
}

interface MapViewProps {
  listings: Listing[];
  onBoundsChange?: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
  initialCenter?: { lat: number; lng: number; zoom?: number };
  children?: React.ReactNode;
}

export function MapView({
  listings,
  onBoundsChange,
  initialCenter,
  children,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: initialCenter?.lat ?? DEFAULT_VIEW.latitude,
    longitude: initialCenter?.lng ?? DEFAULT_VIEW.longitude,
    zoom: initialCenter?.zoom ?? DEFAULT_VIEW.zoom,
  });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const handleMoveEnd = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewState(evt.viewState);

      if (onBoundsChange && mapRef.current) {
        const bounds = mapRef.current.getMap().getBounds();
        onBoundsChange({
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        });
      }
    },
    [onBoundsChange]
  );

  const handleListingClick = useCallback((listing: Listing) => {
    setSelectedListing(listing);
  }, []);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd}
      mapStyle={OPENFREEMAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" />
      <ListingMarkers
        listings={listings}
        zoom={viewState.zoom}
        onListingClick={handleListingClick}
      />
      {selectedListing && (
        <Popup
          longitude={selectedListing.longitude}
          latitude={selectedListing.latitude}
          onClose={() => setSelectedListing(null)}
          closeOnClick={false}
          anchor="top"
          maxWidth="260px"
        >
          <Link href={`/listing/${selectedListing.id}`} className="block">
            {selectedListing.photos?.[0] && (
              <img
                src={selectedListing.photos[0].url}
                alt={selectedListing.title}
                className="w-full h-24 object-cover rounded-t"
                loading="lazy"
              />
            )}
            <div className="p-2">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {selectedListing.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {selectedListing.neighborhood || selectedListing.city}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-primary">
                  {formatPrice(selectedListing.priceMonthly)}/mo
                </span>
                {selectedListing.isVerified && (
                  <Badge variant="success">Verified</Badge>
                )}
              </div>
            </div>
          </Link>
        </Popup>
      )}
      {children}
    </Map>
  );
}
