import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { escrows, users } from "@/lib/db/schema";
import { withRls, withServiceRole } from "@/lib/db/rls";
import { runJob } from "@/lib/jobs/handlers";
import { enqueue } from "@/lib/jobs/queue";

export const dynamic = "force-dynamic";

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
  const body = (await req
    .json()
    .catch(() => ({}))) as { reason?: string };

  const ctx = await withRls(session.user.id, async (tx) => {
    const [escrow] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);
    if (!escrow) return null;
    const [actor] = await tx
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user!.id!))
      .limit(1);
    return { escrow, actorRole: actor?.role };
  });

  if (!ctx) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Escrow not found" } },
      { status: 404 }
    );
  }

  const isLandlord = ctx.escrow.landlordId === session.user.id;
  const isAdmin = ctx.actorRole === "admin";
  if (!isLandlord && !isAdmin) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Not allowed" } },
      { status: 403 }
    );
  }

  try {
    await runJob("refund", {
      escrowId: id,
      reason: body.reason || "voluntary",
    });
  } catch (err) {
    console.error("inline refund failed, enqueuing", err);
    await enqueue("refund", {
      escrowId: id,
      reason: body.reason || "voluntary",
    });
  }

  const updated = await withServiceRole(async (tx) => {
    const [row] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);
    return row;
  });
  return NextResponse.json({ data: updated, error: null });
}
