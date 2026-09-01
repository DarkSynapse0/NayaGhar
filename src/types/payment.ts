export type PaymentProvider = "esewa" | "khalti";

export type InitPaymentRequest = {
  listingId: string;
  amountPaisa: number;
  provider: PaymentProvider;
  quoteId: string;
  moveInDate?: string;
};

export type EsewaInitResponse = {
  provider: "esewa";
  actionUrl: string;
  fields: Record<string, string>;
  paymentId: string;
  escrowId: string;
};

export type KhaltiInitResponse = {
  provider: "khalti";
  paymentUrl: string;
  pidx: string;
  paymentId: string;
  escrowId: string;
};

export type InitPaymentResponse = EsewaInitResponse | KhaltiInitResponse;

export type QuoteResponse = {
  quoteId: string;
  solNprRate: number;
  solUsdRate: number;
  usdNprRate: number;
  expiresAt: string;
  slippageBps: number;
  pythConfBps: number;
};
