"use client";

import { useCallback, useRef, useState } from "react";
import Map, { NavigationControl, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { X, BadgeCheck, MapPin, ArrowRight } from "lucide-react";
import { ListingMarkers } from "./ListingMarkers";
import { formatPriceValue, PROPERTY_TYPE_LABELS, AMENITY_ICONS } from "@/lib/constants";
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
  /** When false, markers are not clickable and no info panel opens (detail map). */
  selectable?: boolean;
  children?: React.ReactNode;
}

export function MapView({
  listings,
  onBoundsChange,
  initialCenter,
  selectable = true,
  children,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: initialCenter?.lat ?? DEFAULT_VIEW.latitude,
    longitude: initialCenter?.lng ?? DEFAULT_VIEW.longitude,
    zoom: initialCenter?.zoom ?? DEFAULT_VIEW.zoom,
  });
  const [selected, setSelected] = useState<Listing | null>(null);

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
    setSelected(listing);
  }, []);

  const handleClusterClick = useCallback(
    (longitude: number, latitude: number, expansionZoom: number) => {
      mapRef.current?.getMap().easeTo({ center: [longitude, latitude], zoom: expansionZoom, duration: 500 });
    },
    []
  );

  const close = useCallback(() => setSelected(null), []);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={close}
        onLoad={(e) => {
          // Mobile browsers often lay the container out after the map inits,
          // leaving a 0-size canvas (blank map). Force a resize once loaded.
          e.target.resize();
        }}
        mapStyle={OPENFREEMAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-left" />
        <ListingMarkers
          listings={listings}
          zoom={viewState.zoom}
          onListingClick={selectable ? handleListingClick : undefined}
          onClusterClick={handleClusterClick}
        />
        {children}
      </Map>

      {selectable && selected && (
        <>
          {/* Desktop: docked full-height panel at the right edge of the map. */}
          <div className="hidden md:flex absolute inset-y-0 right-0 z-10 w-[340px] max-w-[75%] flex-col bg-[var(--panel)] border-l-2 border-[var(--ink)] shadow-warm-3 animate-slide-in-right">
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--ink)] flex items-center justify-center hover:bg-[var(--paper-2)] transition-colors shadow-warm-1"
            >
              <X className="w-4 h-4 text-[var(--ink)]" />
            </button>
            <InfoCard listing={selected} />
          </div>

          {/* Mobile: bottom-sheet that overlays the screen (not clipped by the map box). */}
          <div className="md:hidden fixed inset-0 z-[55] bg-[var(--ink)]/30 animate-fade-in" onClick={close} />
          <div className="md:hidden fixed inset-x-0 bottom-0 z-[60] max-h-[82vh] flex flex-col overflow-hidden bg-[var(--panel)] border-t-2 border-[var(--ink)] rounded-t-2xl shadow-warm-4 animate-slide-in-up">
            {/* Sheet header: grab handle + close */}
            <div className="relative flex items-center justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[var(--ink)]/20" />
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[var(--radius)] flex items-center justify-center hover:bg-[var(--paper-2)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--ink-2)]" />
              </button>
            </div>
            <InfoCard listing={selected} />
          </div>
        </>
      )}
    </div>
  );
}

/** Shared room-info content used by both the desktop side panel and mobile sheet. */
function InfoCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  const amenities = listing.amenities ? Object.entries(listing.amenities).filter(([, v]) => v).slice(0, 4) : [];

  return (
    <>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="relative aspect-[16/10] bg-[var(--paper-2)] overflow-hidden">
          {photo ? (
            <img src={photo.url} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center dot-grid">
              <span className="label text-[var(--ink-3)]">No photo yet</span>
            </div>
          )}
          <span className="label absolute top-3 left-3 rounded-[var(--radius-sm)] bg-[var(--panel)] text-[var(--ink)] border border-[var(--ink)] px-2 py-1">
            {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
          </span>
          {listing.isVerified && (
            <span className="label absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--verified)] text-white px-2 py-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-baseline gap-1.5">
            <span className="price-display text-2xl font-extrabold text-[var(--ink)]">Rs {formatPriceValue(listing.priceMonthly)}</span>
            <span className="text-xs text-[var(--ink-3)] font-medium">/month</span>
          </div>
          <h3 className="mt-2 font-body font-semibold text-[15px] text-[var(--ink)] leading-snug">{listing.title}</h3>
          <div className="mt-1 flex items-center gap-1 text-[13px] text-[var(--ink-2)]">
            <MapPin className="w-3.5 h-3.5 text-[var(--geo)] shrink-0" />
            <span className="truncate">
              {listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city}
            </span>
          </div>

          {listing.deposit ? (
            <p className="mt-2 text-[13px] text-[var(--ink-2)]">
              Deposit <span className="price-display font-semibold text-[var(--ink)]">Rs {formatPriceValue(listing.deposit)}</span>
            </p>
          ) : null}

          {amenities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-3 text-[var(--ink-2)]">
              {amenities.map(([key]) => {
                const Icon = AMENITY_ICONS[key];
                return Icon ? (
                  <span key={key} className="inline-flex items-center gap-1.5 text-[12px]">
                    <Icon className="w-3.5 h-3.5" /> {key}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div className="p-3 border-t border-[var(--line)] bg-[var(--panel)]">
        <Link
          href={`/listing/${listing.id}`}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-[var(--radius)] bg-[var(--brick)] text-[var(--panel)] font-display font-bold hover:bg-[var(--brick-ink)] transition-colors"
        >
          View details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}
