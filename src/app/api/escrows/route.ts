import { NextResponse } from "next/server";
import { desc, or, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { escrows } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  const rows = await withRls(session.user.id, async (tx) =>
    tx
      .select()
      .from(escrows)
      .where(
        or(
          eq(escrows.tenantId, session.user!.id!),
          eq(escrows.landlordId, session.user!.id!)
        )
      )
      .orderBy(desc(escrows.createdAt))
      .limit(100)
  );

  return NextResponse.json({ data: rows, error: null });
}
