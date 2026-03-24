import { ListingCard } from "./ListingCard";
import { Search } from "lucide-react";
import type { Listing } from "@/types/listing";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center mb-4">
          <Search className="w-7 h-7 text-[var(--text-muted)]" />
        </div>
        <p className="text-lg font-bold">No listings found</p>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">Try adjusting your filters or search in a different city</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {listings.map((listing) => (<ListingCard key={listing.id} listing={listing} />))}
    </div>
  );
}
