"use client";

import { useEffect, useState } from "react";
import { Heart, Share2, Check } from "lucide-react";

/** Save (local bookmark) + Share (Web Share / clipboard) for a listing header. */
export function ListingActions({ listingId, title }: { listingId: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const set = JSON.parse(localStorage.getItem("ng:saved") || "[]");
      setSaved(Array.isArray(set) && set.includes(listingId));
    } catch {
      /* ignore */
    }
  }, [listingId]);

  function toggleSave() {
    try {
      const set = new Set<string>(JSON.parse(localStorage.getItem("ng:saved") || "[]"));
      if (set.has(listingId)) set.delete(listingId);
      else set.add(listingId);
      localStorage.setItem("ng:saved", JSON.stringify([...set]));
      setSaved(set.has(listingId));
    } catch {
      /* ignore */
    }
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* user cancelled or unsupported */
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--panel)] text-sm font-semibold text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors";

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button type="button" onClick={toggleSave} className={btn} aria-pressed={saved}>
        <Heart className={`w-4 h-4 ${saved ? "fill-[var(--brick)] text-[var(--brick)]" : ""}`} />
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" onClick={share} className={btn}>
        {copied ? (
          <>
            <Check className="w-4 h-4 text-[var(--verified)]" /> Copied
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" /> Share
          </>
        )}
      </button>
    </div>
  );
}
