"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Listing } from "@/types/listing";

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">
      Loading map...
    </div>
  ),
});

interface ListingDetailMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function ListingDetailMap({
  latitude,
  longitude,
  title,
}: ListingDetailMapProps) {
  // Create a minimal listing-like object for the marker
  const [marker] = useState<Listing[]>([
    {
      id: "detail",
      landlordId: "",
      title,
      description: "",
      embedding: null,
      priceMonthly: 0,
      deposit: null,
      propertyType: "room",
      latitude,
      longitude,
      address: "",
      city: "",
      neighborhood: null,
      amenities: {},
      photos: [],
      videos: [],
      isVerified: false,
      isActive: true,
      availableFrom: null,
      createdAt: new Date(),
    },
  ]);

  return (
    <MapView
      listings={marker}
      initialCenter={{ lat: latitude, lng: longitude, zoom: 15 }}
      selectable={false}
    />
  );
}
