import Link from "next/link";
import { Loader2 } from "lucide-react";

export const metadata = { title: "Processing payment - NayaGhar" };

export default async function EscrowPendingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
        </div>
        <h1 className="text-xl font-bold">Processing your payment</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          We&apos;re still waiting on confirmation from your payment provider. This usually takes
          a few seconds; refresh in a moment.
        </p>
        <Link
          href={`/escrow/${id}`}
          className="inline-block mt-5 text-sm text-[var(--accent)] hover:underline"
        >
          Refresh status →
        </Link>
      </div>
    </div>
  );
}
