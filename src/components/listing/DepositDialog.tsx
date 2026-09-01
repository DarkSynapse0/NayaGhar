"use client";

import { useEffect, useRef, useState } from "react";
import { X, Lock, Shield, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice, MAX_ESCROW_DEPOSIT_NPR, MAX_ESCROW_DEPOSIT_PAISA } from "@/lib/constants";
import type { InitPaymentResponse } from "@/types/payment";

type Props = {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  depositPaisa: number;
};

type Phase = "idle" | "submitting" | "redirecting" | "error";

export function DepositDialog({
  open,
  onClose,
  listingId,
  listingTitle,
  depositPaisa,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<"esewa" | "khalti">("esewa");
  const formRef = useRef<HTMLFormElement>(null);
  const [esewaForm, setEsewaForm] = useState<{
    actionUrl: string;
    fields: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("idle");
    setError(null);
    setEsewaForm(null);
  }, [open]);

  // Auto-submit Esewa form once it's ready
  useEffect(() => {
    if (esewaForm && formRef.current) {
      formRef.current.submit();
    }
  }, [esewaForm]);

  async function handleConfirm() {
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amountPaisa: depositPaisa,
          provider,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message || "Could not start payment");
        setPhase("error");
        return;
      }

      const data = json.data as InitPaymentResponse;
      setPhase("redirecting");

      if (data.provider === "esewa") {
        setEsewaForm({ actionUrl: data.actionUrl, fields: data.fields });
      } else {
        window.location.href = data.paymentUrl;
      }
    } catch {
      setError("Network error — try again");
      setPhase("error");
    }
  }

  if (!open) return null;

  const overCap = depositPaisa > MAX_ESCROW_DEPOSIT_PAISA;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={phase === "submitting" || phase === "redirecting" ? undefined : onClose}
      />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] sm:rounded-2xl rounded-t-2xl shadow-warm-4 animate-scale-in">
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <h2 className="text-base font-bold">Reserve with deposit</h2>
          </div>
          <button
            onClick={onClose}
            disabled={phase === "submitting" || phase === "redirecting"}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Property</p>
          <p className="text-sm font-medium truncate">{listingTitle}</p>
        </div>

        <div className="px-5 sm:px-6 pb-4">
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Refundable deposit
            </p>
            <p className="text-2xl font-bold price-display mt-0.5">
              {formatPrice(depositPaisa)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Held by NayaGhar until you move out, then released to the landlord
              (or refunded to you if the landlord cancels).
            </p>
          </div>
        </div>

        {overCap && (
          <div className="px-5 sm:px-6 pb-4">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                Deposits over Rs {MAX_ESCROW_DEPOSIT_NPR.toLocaleString()} aren&apos;t
                supported on NayaGhar yet (Esewa/Khalti per-transaction limits).
                Message the landlord on WhatsApp to arrange the higher amount
                off-platform.
              </div>
            </div>
          </div>
        )}

        {!overCap && phase !== "redirecting" && (
          <>
            <div className="px-5 sm:px-6 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Pay with
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ProviderTab
                  active={provider === "esewa"}
                  onClick={() => setProvider("esewa")}
                  label="Esewa"
                  sub="ePay v2"
                />
                <ProviderTab
                  active={provider === "khalti"}
                  onClick={() => setProvider("khalti")}
                  label="Khalti"
                  sub="KPG-2"
                />
              </div>
            </div>

            <div className="px-5 sm:px-6 mt-4 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Held in NayaGhar&apos;s escrow account. Released only when both
              parties agree (or admin arbitration).
            </div>

            <div className="px-5 sm:px-6 py-5 border-t border-[var(--border)] mt-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleConfirm}
                disabled={phase === "submitting"}
              >
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Starting payment...
                  </>
                ) : (
                  <>Pay {formatPrice(depositPaisa)} with {provider === "esewa" ? "Esewa" : "Khalti"}</>
                )}
              </Button>
            </div>
          </>
        )}

        {phase === "redirecting" && (
          <div className="px-5 sm:px-6 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Redirecting to {provider}...</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Complete the payment there. We&apos;ll bring you back here.
            </p>
          </div>
        )}

        {phase === "error" && error && (
          <div className="px-5 sm:px-6 pb-5">
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              {error}
            </div>
          </div>
        )}

        {/* Hidden Esewa form, auto-submitted when esewaForm is set */}
        {esewaForm && (
          <form
            ref={formRef}
            method="POST"
            action={esewaForm.actionUrl}
            className="hidden"
          >
            {Object.entries(esewaForm.fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          </form>
        )}
      </div>
    </div>
  );
}

function ProviderTab({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/8"
          : "border-[var(--border)] hover:bg-[var(--bg-hover)]"
      }`}
    >
      <p className={`text-sm font-semibold ${active ? "text-[var(--text)]" : "text-[var(--text-secondary)]"}`}>
        {label}
      </p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>
    </button>
  );
}
