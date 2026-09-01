import { eq, and, inArray, sql } from "drizzle-orm";
import { escrows } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";
import { formatPrice } from "@/lib/constants";
import { Lock, Inbox } from "lucide-react";

type Props = {
  userId: string;
  viewerRole: "tenant" | "landlord";
};

/**
 * Headline card on the dashboard. Shows the user-meaningful number — funds
 * held in escrow (tenant) or pending receipts (landlord).
 */
export async function EscrowSummaryCard({ userId, viewerRole }: Props) {
  const data = await withServiceRole(async (tx) => {
    const partyCol = viewerRole === "tenant" ? escrows.tenantId : escrows.landlordId;
    const [agg] = await tx
      .select({
        heldPaisa: sql<string>`COALESCE(SUM(${escrows.amountPaisa}), 0)::text`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(escrows)
      .where(
        and(
          eq(partyCol, userId),
          inArray(escrows.state, ["funded", "disputed"])
        )
      );

    return {
      heldPaisa: Number(agg.heldPaisa),
      count: agg.count,
    };
  });

  const headline = viewerRole === "tenant" ? "Funds in escrow" : "Pending receipts";
  const sub =
    data.count === 0
      ? viewerRole === "tenant"
        ? "No active deposits"
        : "Waiting on tenant deposits"
      : `${data.count} active escrow${data.count === 1 ? "" : "s"}`;

  const Icon = viewerRole === "tenant" ? Lock : Inbox;
  const iconTone = viewerRole === "tenant" ? "text-[var(--accent)]" : "text-emerald-400";
  const iconBg = viewerRole === "tenant" ? "bg-[var(--accent)]/15" : "bg-emerald-500/15";

  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--accent)]/8 rounded-full blur-[60px]" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-4 h-4 ${iconTone}`} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">{headline}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              held in escrow
            </p>
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-extrabold price-display">
          {formatPrice(data.heldPaisa)}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
