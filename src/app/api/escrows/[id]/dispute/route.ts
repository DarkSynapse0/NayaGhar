import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { escrows } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";

export const dynamic = "force-dynamic";

/**
 * Either tenant or landlord can raise a dispute on a held deposit. The reason
 * text is sha256-hashed for an integrity record; plaintext stays in the
 * release_policy jsonb so admin can read it during arbitration.
 *
 * No on-chain component — the deposit is held by the platform in Esewa, so
 * dispute is a DB state flip + admin workflow. (When attestations land in
 * Phase 2, the dispute will reference the move-in/move-out attestation hashes.)
 */
export async function POST(
  req: NextRequest,
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
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim();
  if (!reason || reason.length < 10) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "REASON_TOO_SHORT",
          message: "Dispute reason must be at least 10 chars",
        },
      },
      { status: 400 }
    );
  }

  const result = await withServiceRole(async (tx) => {
    const [escrow] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);
    if (!escrow) return { kind: "missing" as const };

    const isParty =
      escrow.tenantId === session.user!.id! ||
      escrow.landlordId === session.user!.id!;
    if (!isParty) return { kind: "forbidden" as const };

    if (escrow.state !== "funded") {
      return { kind: "bad_state" as const, state: escrow.state };
    }

    const reasonHash = createHash("sha256").update(reason).digest("hex");

    await tx
      .update(escrows)
      .set({
        state: "disputed",
        releasePolicy: {
          landlordPaisa: 0,
          tenantPaisa: 0,
          reason: `${reason} (sha256: ${reasonHash.slice(0, 16)}…)`,
        },
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, id));

    return { kind: "ok" as const, reasonHash };
  });

  if (result.kind === "missing") {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Escrow not found" } },
      { status: 404 }
    );
  }
  if (result.kind === "forbidden") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Not your escrow" } },
      { status: 403 }
    );
  }
  if (result.kind === "bad_state") {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BAD_STATE",
          message: `Can only dispute funded escrows (state: ${result.state})`,
        },
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    data: { reasonHash: result.reasonHash },
    error: null,
  });
}
