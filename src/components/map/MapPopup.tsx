"use client";

import { Popup } from "react-map-gl/maplibre";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Listing } from "@/types/listing";

function formatPrice(paisa: number): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(paisa / 100);
}

interface MapPopupProps {
  listing: Listing;
  onClose: () => void;
}

export function MapPopup({ listing, onClose }: MapPopupProps) {
  const photo = listing.photos?.[0];

  return (
    <Popup
      longitude={listing.longitude}
      latitude={listing.latitude}
      onClose={onClose}
      closeOnClick={false}
      anchor="top"
      maxWidth="260px"
    >
      <Link href={`/listing/${listing.id}`} className="block">
        {photo && (
          <img
            src={photo.url}
            alt={listing.title}
            className="w-full h-24 object-cover rounded-t"
            loading="lazy"
          />
        )}
        <div className="p-2">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {listing.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {listing.neighborhood || listing.city}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-primary">
              {formatPrice(listing.priceMonthly)}/mo
            </span>
            {listing.isVerified && <Badge variant="success">Verified</Badge>}
          </div>
        </div>
      </Link>
    </Popup>
  );
}
