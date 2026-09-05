"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";

const PRICE = [
  { label: "Any price", min: "", max: "" },
  { label: "Under Rs 5,000", min: "", max: "500000" },
  { label: "Rs 5,000 – 10,000", min: "500000", max: "1000000" },
  { label: "Rs 10,000 – 20,000", min: "1000000", max: "2000000" },
  { label: "Rs 20,000+", min: "2000000", max: "" },
];

/** Horizontal filter bar shown above the listings (desktop). Drives URL params. */
export function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const type = sp.get("type") ?? "";
  const city = sp.get("city") ?? "";
  const minPrice = sp.get("minPrice") ?? "";
  const maxPrice = sp.get("maxPrice") ?? "";
  const priceIndex = Math.max(0, PRICE.findIndex((p) => p.min === minPrice && p.max === maxPrice));

  const [q, setQ] = useState(sp.get("q") ?? "");
  useEffect(() => { setQ(sp.get("q") ?? ""); }, [sp]);

  const hasFilters = !!(q || type || city || minPrice || maxPrice);

  function push(next: Record<string, string>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/search?${p.toString()}`);
  }

  const field =
    "h-11 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--line-strong)] px-3 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brick)]";

  return (
    <div className="hidden lg:flex w-full items-center gap-2 p-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--panel)]">
      <form
        onSubmit={(e) => { e.preventDefault(); push({ q }); }}
        className="flex items-center gap-2 flex-1 min-w-0 h-11 px-3 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--line-strong)]"
      >
        <Search className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Area, landmark, or keyword"
          aria-label="Search rooms"
          className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none"
        />
      </form>

      <select aria-label="Property type" value={type} onChange={(e) => push({ type: e.target.value })} className={field}>
        <option value="">Any type</option>
        {PROPERTY_TYPES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select aria-label="City" value={city} onChange={(e) => push({ city: e.target.value })} className={field}>
        <option value="">All cities</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        aria-label="Price"
        value={priceIndex}
        onChange={(e) => {
          const preset = PRICE[Number(e.target.value)] ?? PRICE[0];
          push({ minPrice: preset.min, maxPrice: preset.max });
        }}
        className={field}
      >
        {PRICE.map((p, i) => (
          <option key={p.label} value={i}>{p.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-[var(--radius)] text-[13px] font-semibold text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger-wash)] transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
