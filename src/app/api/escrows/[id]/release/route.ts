import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { escrows } from "@/lib/db/schema";
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
    .catch(() => ({}))) as { moveOutDate?: string };

  const escrow = await withRls(session.user.id, async (tx) => {
    const [row] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);
    return row;
  });

  if (!escrow) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Escrow not found" } },
      { status: 404 }
    );
  }
  if (escrow.landlordId !== session.user.id) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "Only the landlord can release the deposit",
        },
      },
      { status: 403 }
    );
  }
  if (escrow.state !== "funded") {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BAD_STATE",
          message: `Cannot release in state ${escrow.state}`,
        },
      },
      { status: 409 }
    );
  }

  const moveOut = body.moveOutDate || new Date().toISOString().slice(0, 10);

  try {
    await runJob("release_and_payout", {
      escrowId: id,
      moveOutDate: moveOut,
    });
  } catch (err) {
    console.error("inline release failed, enqueuing", err);
    await enqueue("release_and_payout", {
      escrowId: id,
      moveOutDate: moveOut,
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
