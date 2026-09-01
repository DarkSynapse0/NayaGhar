"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronUp, DoorOpen, Building2, Users, BedDouble, Search } from "lucide-react";

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
    <div className="border-b border-[var(--border)] pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-1 group">
        <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
        <ChevronUp className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function MobileFilterSheet({ defaultQuery, defaultCity }: { defaultQuery: string; defaultCity: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // Local filter state — only applied when "Apply Filters" is clicked
  const [selectedCity, setSelectedCity] = useState(sp.get("city") || defaultCity);
  const [selectedType, setSelectedType] = useState(sp.get("type") || "");
  const [selectedMin, setSelectedMin] = useState(sp.get("minPrice") || "");
  const [selectedMax, setSelectedMax] = useState(sp.get("maxPrice") || "");

  // Sync local state when sheet opens
  useEffect(() => {
    if (open) {
      setSelectedCity(sp.get("city") || defaultCity);
      setSelectedType(sp.get("type") || "");
      setSelectedMin(sp.get("minPrice") || "");
      setSelectedMax(sp.get("maxPrice") || "");
    }
  }, [open, sp, defaultCity]);

  function close() {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 250);
  }

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function applyFilters() {
    const p = new URLSearchParams();
    const q = sp.get("q");
    if (q) p.set("q", q);
    if (selectedCity) p.set("city", selectedCity);
    if (selectedType) p.set("type", selectedType);
    if (selectedMin) p.set("minPrice", selectedMin);
    if (selectedMax) p.set("maxPrice", selectedMax);
    router.push(`/search?${p}`);
    close();
  }

  function clearAll() {
    setSelectedCity("");
    setSelectedType("");
    setSelectedMin("");
    setSelectedMax("");
  }

  function togglePrice(min: string, max: string) {
    if (selectedMin === min && selectedMax === max) {
      setSelectedMin("");
      setSelectedMax("");
    } else {
      setSelectedMin(min);
      setSelectedMax(max);
    }
  }

  const hasLocalFilters = selectedCity || selectedType || selectedMin || selectedMax;
  const hasActiveFilters = sp.get("city") || sp.get("type") || sp.get("minPrice") || sp.get("maxPrice");

  // Count selected filters
  let filterCount = 0;
  if (selectedCity) filterCount++;
  if (selectedType) filterCount++;
  if (selectedMin || selectedMax) filterCount++;

  return (
    <>
      {/* Floating filter button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 h-12 px-5 rounded-[var(--radius)] bg-[var(--brick)] text-white font-display text-sm font-bold shadow-block active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white" />}
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${closing ? "opacity-0" : "animate-fade-in"}`}
            onClick={close}
          />
          <div className={`absolute bottom-0 inset-x-0 max-h-[85vh] bg-[var(--panel)] border-t-2 border-[var(--ink)] rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${closing ? "translate-y-full" : "animate-slide-in-up"}`}>
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--ink)]/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)]">
              <h3 className="font-display text-base font-bold text-[var(--ink)]">Filters</h3>
              <div className="flex items-center gap-3">
                {hasLocalFilters && (
                  <button onClick={clearAll} className="text-xs font-semibold text-[var(--danger)] hover:opacity-80 transition-opacity">
                    Clear all
                  </button>
                )}
                <button onClick={close} className="w-8 h-8 rounded-[var(--radius)] flex items-center justify-center hover:bg-[var(--paper-2)]">
                  <X className="w-4 h-4 text-[var(--ink-2)]" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {/* City */}
              <FilterSection title="City">
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => {
                    const active = selectedCity.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(active ? "" : city)}
                        className={`h-9 px-4 rounded-xl text-sm font-medium transition-all ${
                          active ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30" : "text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Property Type */}
              <FilterSection title="Property Type">
                <div className="flex flex-wrap gap-2">
                  {propertyTypes.map(({ value, label, icon: Icon }) => {
                    const active = selectedType === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedType(active ? "" : value)}
                        className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium transition-all ${
                          active ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30" : "text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Budget */}
              <FilterSection title="Budget">
                <div className="flex flex-wrap gap-2">
                  {pricePresets.map(({ label, min, max }) => {
                    const active = selectedMin === min && selectedMax === max;
                    return (
                      <button
                        key={label}
                        onClick={() => togglePrice(min, max)}
                        className={`h-9 px-4 rounded-xl text-sm font-medium transition-all ${
                          active ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30" : "text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            </div>

            {/* Apply button — sticky at bottom */}
            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
              <button
                onClick={applyFilters}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all"
              >
                <Search className="w-4 h-4" />
                Apply Filters
                {filterCount > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">
                    {filterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
