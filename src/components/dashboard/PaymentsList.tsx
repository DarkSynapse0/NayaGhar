import { desc, eq } from "drizzle-orm";
import { fiatPayments } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";
import { formatPrice } from "@/lib/constants";
import { ArrowDownLeft, ArrowUpRight, Undo2, Receipt } from "lucide-react";

type Props = { userId: string };

const DIR_META = {
  deposit_in: { label: "Deposit", icon: ArrowDownLeft, tone: "text-amber-400" },
  payout_out: { label: "Payout", icon: ArrowUpRight, tone: "text-emerald-400" },
  refund_out: { label: "Refund", icon: Undo2, tone: "text-blue-400" },
} as const;

export async function PaymentsList({ userId }: Props) {
  const rows = await withRls(userId, async (tx) =>
    tx
      .select()
      .from(fiatPayments)
      .where(eq(fiatPayments.userId, userId))
      .orderBy(desc(fiatPayments.createdAt))
      .limit(20)
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border-hover)] p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/8 flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-5 h-5 text-emerald-400 opacity-60" />
        </div>
        <p className="font-semibold">No payments yet</p>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
          Esewa and Khalti transactions will appear here once you make or receive one.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
      {rows.map((p) => {
        const meta = DIR_META[p.direction] ?? DIR_META.deposit_in;
        const Icon = meta.icon;
        const sign = p.direction === "deposit_in" ? "−" : "+";
        return (
          <div
            key={p.id}
            className="flex items-center gap-4 p-4 sm:px-5 sm:py-4 bg-[var(--bg-card)]"
          >
            <div className={`w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 ${meta.tone}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{meta.label}</p>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {p.provider}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">
                {p.providerRef.slice(0, 24)}
                {p.providerRef.length > 24 ? "…" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold price-display ${meta.tone}`}>
                {sign} {formatPrice(p.amountPaisa)}
              </p>
              <p
                className={`text-[10px] capitalize ${
                  p.status === "settled"
                    ? "text-emerald-400"
                    : p.status === "failed"
                    ? "text-red-400"
                    : p.status === "refunded"
                    ? "text-blue-400"
                    : "text-amber-400"
                }`}
              >
                {p.status}
                {p.settledAt && ` · ${new Date(p.settledAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
