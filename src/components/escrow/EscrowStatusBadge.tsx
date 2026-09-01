import { Clock, CheckCircle2, Lock, Undo2, AlertOctagon, XCircle, Gavel, Loader2 } from "lucide-react";
import type { Escrow } from "@/types/escrow";

const MAP: Record<
  Escrow["state"],
  { label: string; tone: string; icon: typeof Clock }
> = {
  pending_fiat: { label: "Awaiting payment", tone: "bg-amber-500/10 text-amber-300 border-amber-500/30", icon: Clock },
  fiat_settled: { label: "Marking held", tone: "bg-amber-500/10 text-amber-300 border-amber-500/30", icon: Loader2 },
  funded: { label: "Held by NayaGhar", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", icon: Lock },
  released: { label: "Released to landlord", tone: "bg-blue-500/10 text-blue-300 border-blue-500/30", icon: CheckCircle2 },
  refunded: { label: "Refunded to tenant", tone: "bg-blue-500/10 text-blue-300 border-blue-500/30", icon: Undo2 },
  disputed: { label: "Disputed", tone: "bg-orange-500/10 text-orange-300 border-orange-500/30", icon: Gavel },
  resolved: { label: "Resolved", tone: "bg-violet-500/10 text-violet-300 border-violet-500/30", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "bg-red-500/10 text-red-300 border-red-500/30", icon: XCircle },
};

export function EscrowStatusBadge({ state }: { state: Escrow["state"] }) {
  const it = MAP[state] ?? { label: state, tone: "bg-gray-500/10 text-gray-300 border-gray-500/30", icon: AlertOctagon };
  const Icon = it.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium ${it.tone}`}>
      <Icon className={`w-3 h-3 ${state === "fiat_settled" ? "animate-spin" : ""}`} />
      {it.label}
    </span>
  );
}
