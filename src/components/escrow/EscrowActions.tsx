"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Undo2, Gavel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Escrow } from "@/types/escrow";

type Props = {
  escrow: Escrow;
  viewerRole: "tenant" | "landlord";
};

export function EscrowActions({ escrow, viewerRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "release" | "refund" | "dispute">(null);
  const [error, setError] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState("");

  if (escrow.state !== "funded" && escrow.state !== "disputed") {
    return null;
  }

  async function call(path: string, kind: "release" | "refund" | "dispute", body?: object) {
    setLoading(kind);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message || "Action failed");
        return;
      }
      router.refresh();
      setShowDispute(false);
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {viewerRole === "landlord" && escrow.state === "funded" && (
          <>
            <Button
              size="md"
              onClick={() => call(`/api/escrows/${escrow.id}/release`, "release")}
              disabled={loading !== null}
            >
              {loading === "release" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Release deposit
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() =>
                call(`/api/escrows/${escrow.id}/refund`, "refund", { reason: "voluntary" })
              }
              disabled={loading !== null}
            >
              {loading === "refund" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Undo2 className="w-4 h-4" />
              )}
              Refund tenant
            </Button>
          </>
        )}
        {escrow.state === "funded" && (
          <Button
            size="md"
            variant="outline"
            onClick={() => setShowDispute((s) => !s)}
            disabled={loading !== null}
          >
            <Gavel className="w-4 h-4" />
            {showDispute ? "Cancel dispute" : "Raise dispute"}
          </Button>
        )}
      </div>

      {showDispute && (
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 space-y-3">
          <p className="text-xs text-[var(--text-muted)]">
            Reason is hashed (sha256) and only the hash goes on-chain — keep it for your records.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue (≥10 chars)..."
            rows={3}
            className="w-full rounded-lg bg-[var(--bg-card)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <Button
            size="md"
            onClick={() => call(`/api/escrows/${escrow.id}/dispute`, "dispute", { reason })}
            disabled={loading !== null || reason.trim().length < 10}
          >
            {loading === "dispute" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
            Submit dispute
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
