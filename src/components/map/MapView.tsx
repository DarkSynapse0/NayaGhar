"use client";

import { useCallback, useRef, useState } from "react";
import Map, { NavigationControl, Popup, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { ListingMarkers } from "./ListingMarkers";
import type { Listing } from "@/types/listing";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Default center: Nepal
const DEFAULT_VIEW = {
  latitude: 28.3949,
  longitude: 84.1240,
  zoom: 7,
};

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
      onClick={() => setSelectedListing(null)}
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
          maxWidth="280px"
        >
          <Link href={`/listing/${selectedListing.id}`} className="block bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            {selectedListing.photos?.[0] ? (
              <div className="relative h-32 overflow-hidden">
                <img
                  src={selectedListing.photos[0].url}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {selectedListing.isVerified && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/80 text-white text-[10px] font-semibold backdrop-blur-sm">✓ Verified</span>
                )}
              </div>
            ) : (
              <div className="h-20 bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] text-xs">No photo</div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-[13px] text-[var(--text)] leading-tight truncate">
                {selectedListing.title}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
                {selectedListing.neighborhood ? `${selectedListing.neighborhood}, ${selectedListing.city}` : selectedListing.city}
              </p>
              <div className="mt-2 pt-2 border-t border-[var(--border)]">
                <span className="text-[15px] font-bold text-[var(--accent)]">
                  Rs. {(selectedListing.priceMonthly / 100).toLocaleString()}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] ml-1">/mo</span>
              </div>
            </div>
          </Link>
        </Popup>
      )}
      {children}
    </Map>
  );
}
