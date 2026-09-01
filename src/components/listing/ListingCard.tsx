import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { PROPERTY_TYPE_LABELS, AMENITY_ICONS, formatPriceValue } from "@/lib/constants";
import type { Listing } from "@/types/listing";

/**
 * Listing card — the core wayfinding unit. Priority order (per PRODUCT.md):
 * real photo, price, verification, location. Server component, no JS, so it
 * stays cheap on 2G. Hover is CSS-only.
 */
export function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.photos?.[0];
  const amenities = listing.amenities
    ? Object.entries(listing.amenities).filter(([, v]) => v)
    : [];
  const shownAmenities = amenities.slice(0, 3);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block rounded-[var(--radius-lg)] overflow-hidden bg-[var(--panel)] border border-[var(--line)] transition-[border-color,transform] duration-200 hover:border-[var(--ink)] hover:-translate-y-0.5"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]">
        {photo ? (
          <img
            src={photo.url}
            alt={photo.alt || listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center dot-grid">
            <span className="label text-[var(--ink-3)]">No photo yet</span>
          </div>
        )}

        {/* Property type — ink chip, top left */}
        <span className="label absolute top-3 left-3 rounded-[var(--radius-sm)] bg-[var(--panel)] text-[var(--ink)] border border-[var(--ink)] px-2 py-1">
          {PROPERTY_TYPE_LABELS[listing.propertyType]}
        </span>

        {/* Verified — the loudest trust signal, top right */}
        {listing.isVerified && (
          <span className="label absolute top-3 right-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--verified)] text-white px-2 py-1">
            <BadgeCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="price-display text-xl font-extrabold text-[var(--ink)]">
            Rs {formatPriceValue(listing.priceMonthly)}
          </span>
          <span className="text-xs text-[var(--ink-3)] font-medium shrink-0">/month</span>
        </div>

        <h3 className="mt-2 font-body font-semibold text-[15px] text-[var(--ink)] leading-snug line-clamp-1">
          {listing.title}
        </h3>

        <div className="mt-1 flex items-center gap-1 text-[13px] text-[var(--ink-2)]">
          <MapPin className="w-3.5 h-3.5 text-[var(--geo)] shrink-0" />
          <span className="truncate">
            {listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city}
          </span>
        </div>

        {shownAmenities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--line)] flex items-center gap-2 text-[var(--ink-3)]">
            {shownAmenities.map(([key]) => {
              const Icon = AMENITY_ICONS[key];
              return Icon ? (
                <span key={key} className="inline-flex items-center gap-1 text-[11px]" title={key}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              ) : null;
            })}
            {amenities.length > 3 && (
              <span className="text-[11px]">+{amenities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
