import type { escrows, fiatPayments } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Escrow = InferSelectModel<typeof escrows>;
export type NewEscrow = InferInsertModel<typeof escrows>;

export type FiatPayment = InferSelectModel<typeof fiatPayments>;
export type NewFiatPayment = InferInsertModel<typeof fiatPayments>;

export type EscrowReleasePolicy = {
  landlordPaisa: number;
  tenantPaisa: number;
  reason?: string;
};
