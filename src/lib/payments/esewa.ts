import "server-only";
import { createHmac } from "node:crypto";

/**
 * Esewa ePay v2 integration.
 *
 * Flow:
 *   1. server: build form fields with HMAC signature → return to client
 *   2. client browser POSTs the form to ESEWA_PAYMENT_URL
 *   3. on success Esewa redirects to our success_url with `?data=<base64>`
 *   4. server: verify signature inside `data`, then call status API for double-check
 */

const SIGNED_FIELDS = ["total_amount", "transaction_uuid", "product_code"];

function sign(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message).digest("base64");
}

export type EsewaInitFields = {
  amount: string; // base amount in NPR (not paisa, not total)
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
};

export function buildEsewaForm(opts: {
  totalNpr: number; // NPR (not paisa)
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}): { actionUrl: string; fields: EsewaInitFields } {
  const merchantCode = process.env.ESEWA_MERCHANT_CODE!;
  const secret = process.env.ESEWA_SECRET_KEY!;
  const actionUrl =
    process.env.ESEWA_PAYMENT_URL ||
    "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

  const total = opts.totalNpr.toFixed(2);
  const message = `total_amount=${total},transaction_uuid=${opts.transactionUuid},product_code=${merchantCode}`;
  const signature = sign(message, secret);

  return {
    actionUrl,
    fields: {
      amount: total,
      tax_amount: "0",
      total_amount: total,
      transaction_uuid: opts.transactionUuid,
      product_code: merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: opts.successUrl,
      failure_url: opts.failureUrl,
      signed_field_names: SIGNED_FIELDS.join(","),
      signature,
    },
  };
}

export type EsewaCallbackPayload = {
  transaction_code: string;
  status: "COMPLETE" | "PENDING" | "FULL_REFUND" | "PARTIAL_REFUND" | "AMBIGUOUS" | "NOT_FOUND" | "CANCELED";
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
};

/** Decode and verify the base64 `data` query param Esewa redirects with. */
export function verifyEsewaCallback(dataB64: string): EsewaCallbackPayload {
  const decoded = Buffer.from(dataB64, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as EsewaCallbackPayload;

  const secret = process.env.ESEWA_SECRET_KEY!;
  const fields = payload.signed_field_names.split(",");
  const message = fields
    .map((f) => `${f}=${(payload as unknown as Record<string, string>)[f]}`)
    .join(",");
  const expected = sign(message, secret);

  if (expected !== payload.signature) {
    throw new EsewaError("ESEWA_BAD_SIGNATURE", "Invalid Esewa signature");
  }
  return payload;
}

/** Server-to-server status check; the source of truth even after the user redirect. */
export async function checkEsewaStatus(
  transactionUuid: string,
  totalNpr: number
): Promise<EsewaCallbackPayload> {
  const merchantCode = process.env.ESEWA_MERCHANT_CODE!;
  const base =
    process.env.ESEWA_STATUS_URL ||
    "https://rc.esewa.com.np/api/epay/transaction/status/";
  const url = `${base}?product_code=${merchantCode}&total_amount=${totalNpr.toFixed(
    2
  )}&transaction_uuid=${transactionUuid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new EsewaError("ESEWA_STATUS_HTTP", `Esewa status HTTP ${res.status}`);
  }
  return (await res.json()) as EsewaCallbackPayload;
}

export class EsewaError extends Error {
  constructor(
    public code:
      | "ESEWA_BAD_SIGNATURE"
      | "ESEWA_STATUS_HTTP"
      | "ESEWA_NOT_SETTLED",
    message: string
  ) {
    super(message);
  }
}
