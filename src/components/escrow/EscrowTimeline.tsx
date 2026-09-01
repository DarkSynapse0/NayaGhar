import { Check } from "lucide-react";
import type { Escrow } from "@/types/escrow";

const STAGES: { key: Escrow["state"]; label: string }[] = [
  { key: "pending_fiat", label: "Pay deposit" },
  { key: "funded", label: "Held by NayaGhar" },
  { key: "released", label: "Released to landlord" },
];

export function EscrowTimeline({ state }: { state: Escrow["state"] }) {
  const idx = (() => {
    switch (state) {
      case "pending_fiat":
        return 0;
      case "fiat_settled":
      case "funded":
        return 1;
      case "released":
      case "resolved":
        return 2;
      case "refunded":
        return 1;
      case "disputed":
        return 1;
      case "failed":
        return 0;
    }
  })();

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s.key} className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  done
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : current
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-px ${done ? "bg-emerald-500/40" : "bg-[var(--border)]"}`}
                />
              )}
            </div>
            <p
              className={`text-[10px] uppercase tracking-wider ${
                current
                  ? "text-[var(--text)] font-semibold"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
