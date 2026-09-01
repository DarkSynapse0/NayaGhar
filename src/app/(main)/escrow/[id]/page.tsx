import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { withRls } from "@/lib/db/rls";
import { escrows, fiatPayments, listings } from "@/lib/db/schema";
import { formatPrice } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { EscrowStatusBadge } from "@/components/escrow/EscrowStatusBadge";
import { EscrowTimeline } from "@/components/escrow/EscrowTimeline";
import { EscrowActions } from "@/components/escrow/EscrowActions";
import { ArrowLeft, ArrowDownCircle, CheckCircle2, Undo2, MapPin } from "lucide-react";

export const metadata = { title: "Escrow - NayaGhar" };

export default async function EscrowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const data = await withRls(session.user.id, async (tx) => {
    const [esc] = await tx.select().from(escrows).where(eq(escrows.id, id)).limit(1);
    if (!esc) return null;
    const [listing] = await tx
      .select()
      .from(listings)
      .where(eq(listings.id, esc.listingId))
      .limit(1);
    const payments = await tx
      .select()
      .from(fiatPayments)
      .where(eq(fiatPayments.escrowId, id));
    return { escrow: esc, listing, payments };
  });

  if (!data || !data.listing) notFound();
  const { escrow, listing, payments } = data;

  const viewerRole: "tenant" | "landlord" =
    escrow.tenantId === session.user.id ? "tenant" : "landlord";

  const payoutPayment = payments.find((p) => p.direction === "payout_out");
  const refundPayment = payments.find((p) => p.direction === "refund_out");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-6 sm:py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Deposit escrow</h1>
          <EscrowStatusBadge state={escrow.state} />
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          You are the {viewerRole}. Escrow ID: <span className="font-mono text-xs">{escrow.id.slice(0, 8)}…</span>
        </p>

        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 sm:p-6 mb-5">
          <EscrowTimeline state={escrow.state} />
        </div>

        {/* Property card */}
        <Link
          href={`/listing/${listing.id}`}
          className="block rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 mb-5 hover:border-[var(--border-hover)] transition-colors"
        >
          <div className="flex items-center gap-4">
            {listing.photos?.[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.photos[0].url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[var(--bg-elevated)] flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{listing.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.neighborhood ? `${listing.neighborhood}, ` : ""}
                {listing.city}
              </p>
            </div>
            <Badge>{listing.propertyType}</Badge>
          </div>
        </Link>

        {/* Numbers */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Stat label="Deposit amount" value={formatPrice(escrow.amountPaisa)} />
          <Stat
            label="Held since"
            value={
              escrow.state === "pending_fiat"
                ? "—"
                : new Date(escrow.updatedAt).toLocaleDateString()
            }
          />
        </div>

        {/* Actions */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 mb-5">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Actions
          </p>
          {escrow.state === "funded" || escrow.state === "disputed" ? (
            <EscrowActions escrow={escrow} viewerRole={viewerRole} />
          ) : escrow.state === "fiat_settled" ? (
            <p className="text-sm text-[var(--text-muted)]">
              Payment received. Escrow will be marked held shortly — refresh in a moment.
            </p>
          ) : escrow.state === "released" && payoutPayment ? (
            <SettledCallout
              tone="emerald"
              icon={CheckCircle2}
              title={
                viewerRole === "landlord"
                  ? "Deposit released to you"
                  : "Deposit released to landlord"
              }
              body={
                viewerRole === "landlord"
                  ? `You received ${formatPrice(payoutPayment.amountPaisa)} via Esewa MerchantPay. See it in Payment history below.`
                  : `${formatPrice(payoutPayment.amountPaisa)} was sent to the landlord via Esewa. See the payout below.`
              }
            />
          ) : escrow.state === "refunded" && refundPayment ? (
            <SettledCallout
              tone="blue"
              icon={Undo2}
              title="Deposit refunded to tenant"
              body={`${formatPrice(refundPayment.amountPaisa)} was returned to the tenant via Esewa. See it in Payment history below.`}
            />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No actions available in state {escrow.state.replace("_", " ")}.
            </p>
          )}
        </div>

        {/* Payments */}
        <div id="payments" className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 scroll-mt-24">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Payment history
          </p>
          {payments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">None yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => {
                const isOutbound = p.direction !== "deposit_in";
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize flex items-center gap-1.5">
                        {isOutbound && <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        {p.direction.replace("_", " ")}
                        <span className="ml-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          {p.provider}
                        </span>
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {new Date(p.createdAt).toLocaleString()} ·{" "}
                        <span className="font-mono">{p.providerRef.slice(0, 16)}…</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold price-display ${isOutbound ? "text-emerald-400" : ""}`}>
                        {isOutbound ? "+" : "−"} {formatPrice(p.amountPaisa)}
                      </p>
                      <p
                        className={`text-[10px] capitalize ${
                          p.status === "settled"
                            ? "text-emerald-400"
                            : p.status === "failed"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {p.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettledCallout({
  tone,
  icon: Icon,
  title,
  body,
}: {
  tone: "emerald" | "blue";
  icon: typeof CheckCircle2;
  title: string;
  body: string;
}) {
  const palette =
    tone === "emerald"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
      : "bg-blue-500/10 border-blue-500/30 text-blue-300";
  return (
    <a
      href="#payments"
      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors hover:brightness-110 ${palette}`}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-80 mt-0.5">{body}</p>
      </div>
      <span className="text-xs opacity-60 underline">View ↓</span>
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="text-xl sm:text-2xl font-extrabold price-display mt-1">{value}</p>
    </div>
  );
}
