"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types/listing";

const HomeMap = dynamic(
  () => import("./HomeMap").then((m) => m.HomeMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full animate-shimmer rounded-b-[20px]" />
    ),
  }
);

export function HomeMapSection({ listings }: { listings: Listing[] }) {
  return <HomeMap listings={listings} />;
}
