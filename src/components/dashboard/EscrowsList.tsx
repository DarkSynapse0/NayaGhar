import Link from "next/link";
import { desc, eq, or } from "drizzle-orm";
import { escrows, listings } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";
import { formatPrice } from "@/lib/constants";
import { EscrowStatusBadge } from "@/components/escrow/EscrowStatusBadge";
import { ArrowUpRight, Lock } from "lucide-react";

type Props = {
  userId: string;
  viewerRole: "tenant" | "landlord";
};

export async function EscrowsList({ userId, viewerRole }: Props) {
  const rows = await withRls(userId, async (tx) =>
    tx
      .select({
        id: escrows.id,
        amountPaisa: escrows.amountPaisa,
        state: escrows.state,
        tenantId: escrows.tenantId,
        landlordId: escrows.landlordId,
        listingId: escrows.listingId,
        createdAt: escrows.createdAt,
        listingTitle: listings.title,
        listingCity: listings.city,
      })
      .from(escrows)
      .leftJoin(listings, eq(listings.id, escrows.listingId))
      .where(or(eq(escrows.tenantId, userId), eq(escrows.landlordId, userId)))
      .orderBy(desc(escrows.createdAt))
      .limit(20)
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border-hover)] p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/8 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5 text-[var(--accent)] opacity-60" />
        </div>
        <p className="font-semibold">No escrows yet</p>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
          {viewerRole === "tenant"
            ? "When you reserve a property with a deposit, you'll see it here."
            : "When a tenant reserves one of your properties, the deposit shows up here."}
        </p>
        {viewerRole === "tenant" && (
          <Link
            href="/search"
            className="inline-block mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            Browse listings →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
      {rows.map((r) => {
        const counterpartyLabel =
          viewerRole === "tenant" ? "Landlord deposit" : "Tenant deposit";
        return (
          <Link
            key={r.id}
            href={`/escrow/${r.id}`}
            className="flex items-center gap-4 p-4 sm:px-5 sm:py-4 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)]/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate group-hover:text-[var(--accent)] transition-colors">
                {r.listingTitle || "Unknown property"}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {counterpartyLabel} · {r.listingCity} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold price-display">
                {formatPrice(r.amountPaisa)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">deposit</p>
            </div>
            <EscrowStatusBadge state={r.state} />
            <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors hidden sm:block" />
          </Link>
        );
      })}
    </div>
  );
}
