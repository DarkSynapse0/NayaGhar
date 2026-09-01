"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, DoorOpen, Building2, Users, BedDouble, X, Search } from "lucide-react";

const propertyTypes = [
  { value: "room", label: "Room", icon: DoorOpen },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "pg", label: "PG", icon: Users },
  { value: "hostel", label: "Hostel", icon: BedDouble },
];

const CITIES = ["Kathmandu", "Lalitpur", "Pokhara", "Biratnagar", "Bharatpur", "Bhaktapur"];

const pricePresets = [
  { label: "Under Rs 5K", min: "", max: "500000" },
  { label: "Rs 5K – 10K", min: "500000", max: "1000000" },
  { label: "Rs 10K – 20K", min: "1000000", max: "2000000" },
  { label: "Rs 20K+", min: "2000000", max: "" },
];

function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--line)] pb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-1 group">
        <span className="label text-[var(--ink-2)]">{title}</span>
        <ChevronUp className={`w-4 h-4 text-[var(--ink-3)] group-hover:text-[var(--ink)] transition-transform duration-200 ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function optionClass(active: boolean) {
  return `flex items-center justify-between w-full h-10 px-3 rounded-[var(--radius)] text-sm font-medium transition-colors duration-150 ${
    active
      ? "bg-[var(--brick-wash)] text-[var(--brick)] border border-[var(--brick)]/30"
      : "text-[var(--ink-2)] border border-transparent hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
  }`;
}

export function FilterSidebar({ defaultQuery = "", defaultCity = "" }: { defaultQuery?: string; defaultCity?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const currentType = sp.get("type") || "";
  const currentCity = sp.get("city") || defaultCity;
  const [query, setQuery] = useState(defaultQuery);

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
  }

  const hasFilters = currentType || currentCity || sp.get("minPrice") || sp.get("maxPrice") || sp.get("q");

  return (
    <div className="space-y-5">
      {/* Search input */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" />
          <input
            type="text"
            placeholder="Search keywords"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--ink-3)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--brick)] focus:ring-2 focus:ring-[var(--ring)] transition-colors"
          />
        </div>
      </form>

      {hasFilters && (
        <button onClick={clearAll} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--danger)] hover:opacity-80 transition-opacity">
          <X className="w-3 h-3" />Clear all filters
        </button>
      )}

      <FilterSection title="Property type" defaultOpen={false}>
        <div className="space-y-1">
          {propertyTypes.map(({ value, label, icon: Icon }) => {
            const active = currentType === value;
            return (
              <button key={value} onClick={() => updateParam("type", active ? "" : value)} className={optionClass(active)}>
                <span className="flex items-center gap-3"><Icon className="w-4 h-4" />{label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brick)]" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="City">
        <div className="space-y-1">
          {CITIES.map((city) => {
            const active = currentCity.toLowerCase() === city.toLowerCase();
            return (
              <button key={city} onClick={() => updateParam("city", active ? "" : city)} className={optionClass(active)}>
                {city}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brick)]" />}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Budget" defaultOpen={false}>
        <div className="space-y-1">
          {pricePresets.map(({ label, min, max }) => {
            const active = sp.get("minPrice") === min && sp.get("maxPrice") === max && (min !== "" || max !== "");
            return (
              <button key={label} onClick={() => applyPrice(active ? "" : min, active ? "" : max)} className={optionClass(active)}>
                {label}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brick)]" />}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}
