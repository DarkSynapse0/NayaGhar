"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  listingId: string;
};

export function ReviewForm({ listingId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) {
      setError("Pick a star rating");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, rating, text: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message || "Could not post review");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const display = hover || rating;

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] p-5 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <p className="font-display text-sm font-bold text-[var(--ink)]">Write a review</p>
        <span className="label text-[var(--verified)] bg-[var(--verified-wash)] border border-[var(--verified)]/30 px-1.5 py-0.5 rounded-[var(--radius-sm)]">
          Verified stay
        </span>
      </div>
      <p className="text-xs text-[var(--ink-3)] mb-4">
        Only people who actually rented this place can leave a review. The badge
        next to your review proves it.
      </p>

      <div className="flex items-center gap-1 mb-4" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="p-1 transition-transform active:scale-90"
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                n <= display
                  ? "text-[var(--pending)] fill-[var(--pending)]"
                  : "text-[var(--ink-3)] opacity-40"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">
            {rating} / 5
          </span>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What was the place like? Any tips for future tenants? (optional)"
        rows={3}
        maxLength={1000}
        className="w-full rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--ink-3)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--brick)] focus:ring-2 focus:ring-[var(--ring)] resize-none"
      />
      <p className="text-[10px] text-[var(--ink-3)] mt-1 text-right">
        {text.length}/1000
      </p>

      {error && (
        <div className="mt-3 rounded-[var(--radius)] bg-[var(--danger-wash)] border border-[var(--danger)]/30 px-3 py-2 text-xs text-[var(--danger)] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting || rating < 1}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Posting...
            </>
          ) : (
            "Post review"
          )}
        </Button>
      </div>
    </div>
  );
}
