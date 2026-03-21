"use client";

import { useState } from "react";

export function ListingToggle({ listingId, initialActive }: { listingId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    // Optimistic update — flip immediately
    setActive(!active);
    try {
      const res = await fetch(`/api/listings/${listingId}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setActive(data.data.isActive);
      } else {
        // Revert on failure
        setActive(active);
      }
    } catch {
      setActive(active);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-3 group disabled:opacity-60"
    >
      {/* Toggle track */}
      <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${active ? "bg-emerald-500" : "bg-red-500/70"}`}>
        {/* Toggle thumb */}
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${active ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </div>
      {/* Label */}
      <span className={`text-sm font-medium transition-colors duration-300 ${active ? "text-emerald-400" : "text-red-400/70"}`}>
        {active ? "Available" : "Rented"}
      </span>
    </button>
  );
}
