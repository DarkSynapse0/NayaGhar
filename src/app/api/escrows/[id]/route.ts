import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { escrows, fiatPayments } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  const result = await withRls(session.user.id, async (tx) => {
    const [escrow] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);
    if (!escrow) return null;

    // Authorization happens in two places — RLS limits the row set to escrows
    // the user is a party to, AND we double-check here in case RLS isn't
    // FORCEd yet.
    if (
      escrow.tenantId !== session.user!.id! &&
      escrow.landlordId !== session.user!.id!
    ) {
      return { forbidden: true as const };
    }

    const payments = await tx
      .select()
      .from(fiatPayments)
      .where(eq(fiatPayments.escrowId, id));
    return { escrow, payments };
  });

  if (!result) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Escrow not found" } },
      { status: 404 }
    );
  }
  if ("forbidden" in result) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Not your escrow" } },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: result, error: null });
}
