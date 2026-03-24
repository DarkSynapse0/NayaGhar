"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, DoorOpen, Building2, Users, BedDouble } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const propertyTypes = [
  { value: "room", label: "Room", icon: DoorOpen },
  { value: "apartment", label: "Apt", icon: Building2 },
  { value: "pg", label: "PG", icon: Users },
  { value: "hostel", label: "Hostel", icon: BedDouble },
];

const pricePresets = [
  { label: "Under 5K", min: "", max: "500000" },
  { label: "5-10K", min: "500000", max: "1000000" },
  { label: "10-20K", min: "1000000", max: "2000000" },
  { label: "20K+", min: "2000000", max: "" },
];

export function FilterPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const [showAll, setShowAll] = useState(false);
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") || "");
  const currentType = sp.get("type") || "";

  function toggleType(type: string) { const p = new URLSearchParams(sp.toString()); if (currentType === type) p.delete("type"); else p.set("type", type); router.push(`/search?${p}`); }
  function applyPrice(min: string, max: string) { const p = new URLSearchParams(sp.toString()); if (min) p.set("minPrice", min); else p.delete("minPrice"); if (max) p.set("maxPrice", max); else p.delete("maxPrice"); router.push(`/search?${p}`); }
  function clearFilters() { const p = new URLSearchParams(); const q = sp.get("q"); const city = sp.get("city"); if (q) p.set("q", q); if (city) p.set("city", city); router.push(`/search?${p}`); }

  const hasFilters = currentType || sp.get("minPrice") || sp.get("maxPrice");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {propertyTypes.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => toggleType(value)} className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${currentType === value ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}

        <div className="w-px h-5 bg-[var(--bg-elevated)] flex-shrink-0" />

        {pricePresets.map(({ label, min, max }) => (
          <button key={label} onClick={() => applyPrice(min, max)} className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${sp.get("minPrice") === min && sp.get("maxPrice") === max ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]"}`}>
            {label}
          </button>
        ))}

        <div className="w-px h-5 bg-[var(--bg-elevated)] flex-shrink-0" />

        <button onClick={() => setShowAll(!showAll)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)] transition-all">
          <SlidersHorizontal className="w-3.5 h-3.5" />Custom
        </button>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors whitespace-nowrap">
            <X className="w-3 h-3" />Clear
          </button>
        )}
      </div>

      {showAll && (
        <div className="flex items-center gap-3 animate-fade-in">
          <Input placeholder="Min price" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="max-w-[140px]" />
          <Input placeholder="Max price" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="max-w-[140px]" />
          <Button size="sm" onClick={() => applyPrice(minPrice, maxPrice)}>Apply</Button>
        </div>
      )}
    </div>
  );
}
