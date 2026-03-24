"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, DoorOpen, Building2, Users, BedDouble, X, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const propertyTypes = [
  { value: "room", label: "Room", icon: DoorOpen },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "pg", label: "PG", icon: Users },
  { value: "hostel", label: "Hostel", icon: BedDouble },
];

const CITIES = ["Kathmandu", "Lalitpur", "Pokhara", "Biratnagar", "Bharatpur", "Bhaktapur"];

const pricePresets = [
  { label: "Under 5K", min: "", max: "500000" },
  { label: "5K - 10K", min: "500000", max: "1000000" },
  { label: "10K - 20K", min: "1000000", max: "2000000" },
  { label: "20K+", min: "2000000", max: "" },
];

function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--border)] pb-5">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-2 group">
        <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
        <ChevronUp className={`w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-all duration-200 ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ defaultQuery = "", defaultCity = "" }: { defaultQuery?: string; defaultCity?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const currentType = sp.get("type") || "";
  const currentCity = sp.get("city") || defaultCity;
  const [query, setQuery] = useState(defaultQuery);
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") || "");

  function navigate(params: URLSearchParams) { router.push(`/search?${params}`); }

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    navigate(p);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(sp.toString());
    if (query) p.set("q", query); else p.delete("q");
    navigate(p);
  }

  function applyPrice(min: string, max: string) {
    const p = new URLSearchParams(sp.toString());
    if (min) p.set("minPrice", min); else p.delete("minPrice");
    if (max) p.set("maxPrice", max); else p.delete("maxPrice");
    navigate(p);
  }

  function clearAll() {
    router.push("/search");
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
  }

  const hasFilters = currentType || currentCity || sp.get("minPrice") || sp.get("maxPrice") || sp.get("q");

  return (
    <div className="space-y-5">
      {/* Search input */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>
      </form>

      {/* Clear all */}
      {hasFilters && (
        <button onClick={clearAll} className="flex items-center gap-1.5 text-xs font-semibold text-red-400/60 hover:text-red-400 transition-colors">
          <X className="w-3 h-3" />Clear all filters
        </button>
      )}

      {/* Property Type */}
      <FilterSection title="Property Type" defaultOpen={false}>
        <div className="space-y-1">
          {propertyTypes.map(({ value, label, icon: Icon }) => {
            const active = currentType === value;
            return (
              <button
                key={value}
                onClick={() => updateParam("type", active ? "" : value)}
                className={`flex items-center gap-3 w-full h-10 px-3 rounded-xl text-sm transition-all duration-200 ${
                  active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* City */}
      <FilterSection title="City">
        <div className="space-y-1">
          {CITIES.map((city) => {
            const active = currentCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => updateParam("city", active ? "" : city)}
                className={`flex items-center justify-between w-full h-10 px-3 rounded-xl text-sm transition-all duration-200 ${
                  active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white/70"
                }`}
              >
                {city}
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Budget */}
      <FilterSection title="Budget" defaultOpen={false}>
        <div className="space-y-1 mb-3">
          {pricePresets.map(({ label, min, max }) => {
            const active = sp.get("minPrice") === min && sp.get("maxPrice") === max;
            return (
              <button
                key={label}
                onClick={() => applyPrice(active ? "" : min, active ? "" : max)}
                className={`flex items-center justify-between w-full h-10 px-3 rounded-xl text-sm transition-all duration-200 ${
                  active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white/70"
                }`}
              >
                {label}
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}
