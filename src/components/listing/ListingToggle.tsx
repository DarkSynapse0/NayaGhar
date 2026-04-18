"use client";

import { useState } from "react";

export function ListingToggle({ listingId, initialActive }: { listingId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setLoading(true);
    setError(false);
    const prev = active;
    // Optimistic update
    setActive(!active);

    try {
      const res = await fetch(`/api/listings/${listingId}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setActive(data.data.isActive);
      } else {
        setActive(prev);
        setError(true);
      }
    } catch {
      setActive(prev);
      setError(true);
    } finally {
      setLoading(false);
      // Auto-dismiss error after 3 seconds
      if (error) {
        setTimeout(() => setError(false), 3000);
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-3 group disabled:opacity-60"
        aria-label={active ? "Mark as rented" : "Mark as available"}
      >
        {/* Toggle track */}
        <div
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
            active ? "bg-emerald-500" : "bg-red-500/70"
          }`}
        >
          {/* Toggle thumb */}
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
              active ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </div>
        {/* Label */}
        <span
          className={`text-sm font-medium transition-colors duration-300 ${
            active ? "text-emerald-400" : "text-red-400/70"
          }`}
        >
          {active ? "Available" : "Rented"}
        </span>
      </button>
      {error && (
        <p className="text-[11px] text-red-400 animate-fade-in">Failed to update</p>
      )}
    </div>
  );
}
