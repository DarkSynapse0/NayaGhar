"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X, MapPin } from "lucide-react";
import { CITIES, PROPERTY_TYPES } from "@/lib/constants";
import type { Listing } from "@/types/listing";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-shimmer" />,
});

// Budget ceilings (paisa) — mirrors the /search maxPrice param.
const BUDGETS = [
  { value: "800000", label: "Up to Rs 8,000" },
  { value: "1500000", label: "Up to Rs 15,000" },
  { value: "2500000", label: "Up to Rs 25,000" },
  { value: "4000000", label: "Up to Rs 40,000" },
];

// Well-known areas renters search for — one tap sets the keyword and re-fits the map.
const POPULAR = [
  "Kirtipur", "Baneshwor", "Koteshwor", "Kalanki", "Thamel",
  "Patan", "Chabahil", "Boudha", "Lakeside", "Pulchowk",
];

type Filters = { q: string; type: string; city: string; maxPrice: string };
const EMPTY: Filters = { q: "", type: "", city: "", maxPrice: "" };

const NEPAL = { lat: 28.3949, lng: 84.124, zoom: 7 };

export function HomeSearchMap({ listings }: { listings: Listing[] }) {
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [nonce, setNonce] = useState(0);

  const filtered = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return listings.filter((l) => {
      if (applied.type && l.propertyType !== applied.type) return false;
      if (applied.city && l.city !== applied.city) return false;
      if (applied.maxPrice && l.priceMonthly > Number(applied.maxPrice)) return false;
      if (q) {
        const hay = `${l.title} ${l.address ?? ""} ${l.neighborhood ?? ""} ${l.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [listings, applied]);

  // Bounding box of the matches, tagged with nonce so the map re-fits on each search.
  const focus = useMemo(() => {
    if (nonce === 0 || filtered.length === 0) return null;
    const lats = filtered.map((l) => l.latitude);
    const lngs = filtered.map((l) => l.longitude);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    if (minLat === maxLat) { minLat -= 0.01; maxLat += 0.01; }
    if (minLng === maxLng) { minLng -= 0.01; maxLng += 0.01; }
    return { minLat, maxLat, minLng, maxLng, nonce };
  }, [filtered, nonce]);

  function apply(next: Filters) {
    setDraft(next);
    setApplied(next);
    setNonce((n) => n + 1);
  }

  const hasFilters = !!(applied.q || applied.type || applied.city || applied.maxPrice);

  // Deep-link to the full search page with the same filters.
  const fullSearchHref = useMemo(() => {
    const p = new URLSearchParams();
    if (applied.q) p.set("q", applied.q);
    if (applied.type) p.set("type", applied.type);
    if (applied.city) p.set("city", applied.city);
    if (applied.maxPrice) p.set("maxPrice", applied.maxPrice);
    const qs = p.toString();
    return qs ? `/search?${qs}` : "/search";
  }, [applied]);

  const fieldClass =
    "h-11 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--ink)] px-3 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brick)]";

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 lg:items-start">
      {/* Left — search only (results appear on the map) */}
      <div className="rounded-[var(--radius-lg)] border-2 border-[var(--ink)] bg-[var(--panel)] p-4">
        <form onSubmit={(e) => { e.preventDefault(); apply(draft); }} className="space-y-2.5">
          <div className="flex items-center gap-2 h-11 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--ink)] px-3">
            <Search className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
            <input
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              placeholder="Area, landmark, or keyword"
              aria-label="Search a place"
              className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <select aria-label="Property type" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} className={fieldClass}>
              <option value="">Any type</option>
              {PROPERTY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select aria-label="Budget" value={draft.maxPrice} onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))} className={fieldClass}>
              <option value="">Any budget</option>
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <select aria-label="City" value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} className={`${fieldClass} w-full`}>
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button type="submit" className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-[var(--radius)] bg-[var(--brick)] text-[var(--panel)] font-display font-bold hover:bg-[var(--brick-ink)] transition-colors">
            <Search className="w-4 h-4" /> Search
          </button>
        </form>

        {/* Count + actions (no list — the pins on the map are the results) */}
        <div className="mt-3 pt-3 border-t border-[var(--line)]">
          <p className="text-[13px] text-[var(--ink-2)]">
            {filtered.length === 0 ? (
              <>No places match. Try a wider budget or another area.</>
            ) : (
              <>
                <span className="price-display font-bold text-[var(--ink)]">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "place" : "places"} on the map. Tap a pin to see it.
              </>
            )}
          </p>
          <div className="mt-2 flex items-center gap-4">
            {hasFilters && (
              <button type="button" onClick={() => apply(EMPTY)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <Link href={fullSearchHref} className="text-[13px] font-semibold text-[var(--brick)] hover:text-[var(--brick-ink)] transition-colors">
              Open full results
            </Link>
          </div>
        </div>

        {/* Popular places — one tap searches that area on the map */}
        <div className="mt-4 pt-4 border-t border-[var(--line)]">
          <p className="label text-[var(--ink-3)]">Popular places</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR.map((kw) => {
              const active = applied.q.trim().toLowerCase() === kw.toLowerCase();
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => apply({ ...applied, q: kw })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] border text-[13px] font-semibold transition-colors ${
                    active
                      ? "bg-[var(--brick)] border-[var(--ink)] text-[var(--panel)]"
                      : "bg-[var(--paper)] border-[var(--ink)] text-[var(--ink)] hover:text-[var(--brick)]"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> {kw}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right — map (the results, as home pins) */}
      <div className="relative h-[420px] lg:h-[560px] rounded-[var(--radius-lg)] overflow-hidden border-2 border-[var(--ink)]">
        <MapView listings={filtered} focus={focus} initialCenter={NEPAL} />
      </div>
    </div>
  );
}
