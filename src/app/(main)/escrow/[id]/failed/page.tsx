import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = { title: "Payment failed - NayaGhar" };

export default async function EscrowFailedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold">Payment didn&apos;t go through</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Either the provider declined the transaction or it was canceled. Nothing was charged
          and no escrow was created.
        </p>
        <div className="flex gap-2 mt-5 justify-center">
          <Link
            href="/search"
            className="text-sm px-4 py-2 rounded-full border border-[var(--border)] hover:bg-[var(--bg-hover)]"
          >
            Browse listings
          </Link>
          <Link
            href={`/escrow/${id}`}
            className="text-sm px-4 py-2 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}
