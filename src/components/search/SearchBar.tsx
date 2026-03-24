"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home, X, ChevronDown, Check } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const CITIES = [
  { value: "", label: "All Cities" },
  { value: "Kathmandu", label: "Kathmandu" },
  { value: "Lalitpur", label: "Lalitpur" },
  { value: "Pokhara", label: "Pokhara" },
  { value: "Biratnagar", label: "Biratnagar" },
  { value: "Bharatpur", label: "Bharatpur" },
  { value: "Bhaktapur", label: "Bhaktapur" },
];

interface Suggestion { id: string; title: string; city: string; neighborhood: string | null; propertyType: string; priceMonthly: number; }

export function SearchBar({ defaultQuery = "", defaultCity = "" }: { defaultQuery?: string; defaultCity?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState(defaultCity);
  const [cityOpen, setCityOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ cities: string[]; listings: Suggestion[] }>({ cities: [], listings: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setSuggestions({ cities: [], listings: [] }); setShowDropdown(false); return; }
    setLoading(true);
    fetch(`/api/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json()).then((d) => { setSuggestions(d.data || { cities: [], listings: [] }); setShowDropdown(true); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setCityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(path: string) { setShowDropdown(false); setCityOpen(false); router.push(path); }
  function handleSearch(e: React.FormEvent) { e.preventDefault(); const p = new URLSearchParams(); if (query) p.set("q", query); if (city) p.set("city", city); navigate(`/search?${p}`); }
  function selectCity(c: string) { setCity(c); const p = new URLSearchParams(); if (query) p.set("q", query); if (c) p.set("city", c); navigate(`/search?${p}`); }
  function selectListing(id: string) { navigate(`/listing/${id}`); }
  function searchFor(t: string) { setQuery(t); const p = new URLSearchParams(); p.set("q", t); if (city) p.set("city", city); navigate(`/search?${p}`); }

  const hasSuggestions = suggestions.cities.length > 0 || suggestions.listings.length > 0;
  const selectedCityLabel = CITIES.find((c) => c.value === city)?.label || "All Cities";

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSearch} className="flex items-center bg-[var(--bg-card)] rounded-full border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <div className="flex-1 flex items-center min-w-0">
          <Search className="w-4 h-4 text-[var(--text-muted)] ml-4 sm:ml-5 flex-shrink-0" />
          <input type="text" placeholder="Search by title, area, or keyword..." value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => { if (hasSuggestions) setShowDropdown(true); }}
            className="flex-1 px-3 py-3 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none min-w-0" autoComplete="off" />
          {query && <button type="button" onClick={() => { setQuery(""); setSuggestions({ cities: [], listings: [] }); setShowDropdown(false); }} className="p-1.5 rounded-full hover:bg-[var(--bg-hover)]"><X className="w-3.5 h-3.5 text-[var(--text-muted)]" /></button>}
        </div>
        <div className="hidden sm:block">
          <button type="button" onClick={() => { setCityOpen(!cityOpen); setShowDropdown(false); }} className="flex items-center gap-1.5 px-4 py-3 border-l border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{selectedCityLabel}</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${cityOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <button type="submit" className="m-1.5 px-4 sm:px-5 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors active:scale-[0.97] flex-shrink-0">
          <Search className="w-4 h-4 sm:hidden" /><span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {/* Mobile city pills */}
      <div className="sm:hidden mt-2 flex gap-2 overflow-x-auto no-scrollbar">
        {CITIES.map((c) => (
          <button key={c.value} type="button" onClick={() => selectCity(c.value)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${city === c.value ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)]"}`}>{c.label}</button>
        ))}
      </div>

      {/* City dropdown */}
      {cityOpen && (
        <div className="absolute right-12 top-full mt-2 w-48 bg-[var(--bg-card)] rounded-xl border border-[var(--border-hover)] shadow-warm-4 max-h-[280px] overflow-y-auto overscroll-contain animate-scale-in">
          {CITIES.map((c) => (
            <button key={c.value} type="button" onClick={() => selectCity(c.value)} className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-colors ${city === c.value ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"}`}>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{c.label}</div>
              {city === c.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && hasSuggestions && !cityOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-hover)] shadow-warm-4 max-h-[360px] overflow-y-auto overscroll-contain animate-scale-in">
          {suggestions.cities.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Cities</p>
              {suggestions.cities.map((c) => (
                <button key={c} onClick={() => { setShowDropdown(false); selectCity(c); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors">
                  <MapPin className="w-4 h-4 text-emerald-400" /><div><p className="text-sm font-medium text-[var(--text)]">{c}</p><p className="text-xs text-[var(--text-muted)]">View all in {c}</p></div>
                </button>
              ))}
            </div>
          )}
          {suggestions.listings.length > 0 && (
            <div className={`p-2 ${suggestions.cities.length > 0 ? "border-t border-[var(--border)]" : ""}`}>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Properties</p>
              {suggestions.listings.map((l) => (
                <button key={l.id} onClick={() => selectListing(l.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors">
                  <Home className="w-4 h-4 text-[var(--accent)]" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[var(--text)] truncate">{l.title}</p><p className="text-xs text-[var(--text-muted)]">{l.neighborhood ? `${l.neighborhood}, ` : ""}{l.city} · Rs. {(l.priceMonthly / 100).toLocaleString()}/mo</p></div>
                </button>
              ))}
            </div>
          )}
          <div className="p-2 border-t border-[var(--border)]">
            <button onClick={() => searchFor(query)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors">
              <Search className="w-4 h-4 text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">Search for &ldquo;<span className="font-medium text-[var(--text)]">{query}</span>&rdquo;</p>
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && query.length >= 2 && !hasSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-hover)] shadow-warm-4 p-4 animate-fade-in">
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" /><p className="text-sm text-[var(--text-muted)]">Searching...</p></div>
        </div>
      )}
    </div>
  );
}
