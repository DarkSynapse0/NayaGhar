"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function MobileSearchBar({ defaultQuery = "", defaultCity = "" }: { defaultQuery?: string; defaultCity?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  // Sync when defaultQuery changes (e.g. after clearing filters)
  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (defaultCity) p.set("city", defaultCity);
    router.push(`/search?${p}`);
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" />
      <input
        type="text"
        placeholder="Search by area, landmark, or keyword"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-12 pl-11 pr-4 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--ink-3)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--brick)] focus:ring-2 focus:ring-[var(--ring)] transition-colors"
        autoComplete="off"
      />
    </form>
  );
}
