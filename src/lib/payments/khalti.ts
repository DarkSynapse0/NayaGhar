import "server-only";

/**
 * Khalti KPG-2 (epayment) integration.
 *
 * Flow:
 *   1. server POST /epayment/initiate → { payment_url, pidx }
 *   2. client redirects to payment_url, completes payment
 *   3. Khalti redirects to return_url?pidx=...
 *   4. server POST /epayment/lookup with pidx → settlement status (also fired as webhook)
 */

function khaltiBase(): string {
  return process.env.KHALTI_BASE_URL || "https://dev.khalti.com";
}

function khaltiAuth(): Record<string, string> {
  const key = process.env.KHALTI_SECRET_KEY;
  if (!key) throw new KhaltiError("KHALTI_NOT_CONFIGURED", "missing key");
  return {
    Authorization: `Key ${key}`,
    "Content-Type": "application/json",
  };
}

export type KhaltiInitiate = {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
};

export async function initiateKhaltiPayment(opts: {
  totalPaisa: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
  customer: { name: string; email?: string; phone?: string };
}): Promise<KhaltiInitiate> {
  const res = await fetch(`${khaltiBase()}/api/v2/epayment/initiate/`, {
    method: "POST",
    headers: khaltiAuth(),
    body: JSON.stringify({
      return_url: opts.returnUrl,
      website_url: opts.websiteUrl,
      amount: opts.totalPaisa,
      purchase_order_id: opts.purchaseOrderId,
      purchase_order_name: opts.purchaseOrderName,
      customer_info: opts.customer,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new KhaltiError("KHALTI_INITIATE_HTTP", `${res.status}: ${text}`);
  }
  return (await res.json()) as KhaltiInitiate;
}

export type KhaltiLookup = {
  pidx: string;
  total_amount: number; // paisa
  status:
    | "Completed"
    | "Pending"
    | "Initiated"
    | "Refunded"
    | "Expired"
    | "User canceled";
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
};

export async function lookupKhaltiPayment(pidx: string): Promise<KhaltiLookup> {
  const res = await fetch(`${khaltiBase()}/api/v2/epayment/lookup/`, {
    method: "POST",
    headers: khaltiAuth(),
    body: JSON.stringify({ pidx }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new KhaltiError("KHALTI_LOOKUP_HTTP", `${res.status}: ${text}`);
  }
  return (await res.json()) as KhaltiLookup;
}

export class KhaltiError extends Error {
  constructor(
    public code:
      | "KHALTI_NOT_CONFIGURED"
      | "KHALTI_INITIATE_HTTP"
      | "KHALTI_LOOKUP_HTTP"
      | "KHALTI_NOT_SETTLED",
    message: string
  ) {
    super(message);
  }
}
