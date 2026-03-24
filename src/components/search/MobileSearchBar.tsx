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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
      <input
        type="text"
        placeholder="Search by title, area, or keyword..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
        autoComplete="off"
      />
    </form>
  );
}
