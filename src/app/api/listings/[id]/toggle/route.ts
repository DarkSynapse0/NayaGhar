import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { listings } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Both SELECT (visible-or-owner) and UPDATE (owner-only) happen in user
    // RLS context. Combined with the explicit landlordId check below this is
    // belt-and-braces.
    const result = await withRls(session.user.id, async (tx) => {
      const [listing] = await tx
        .select()
        .from(listings)
        .where(eq(listings.id, id))
        .limit(1);

      if (!listing) return { kind: "missing" as const };
      if (listing.landlordId !== session.user!.id!) {
        return { kind: "forbidden" as const };
      }

      const [updated] = await tx
        .update(listings)
        .set({ isActive: !listing.isActive })
        .where(eq(listings.id, id))
        .returning();
      return { kind: "ok" as const, updated };
    });

    if (result.kind === "missing") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Listing not found" } },
        { status: 404 }
      );
    }
    if (result.kind === "forbidden") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only manage your own listings" } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: { id: result.updated.id, isActive: result.updated.isActive },
      error: null,
    });
  } catch (error) {
    console.error("Toggle listing error:", error);
    return NextResponse.json(
      { error: { code: "TOGGLE_ERROR", message: "Failed to update listing status" } },
      { status: 500 }
    );
  }
}
