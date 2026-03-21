import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Verify the listing belongs to this landlord
    const [listing] = await getDb()
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!listing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Listing not found" } },
        { status: 404 }
      );
    }

    if (listing.landlordId !== session.user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only manage your own listings" } },
        { status: 403 }
      );
    }

    // Toggle active status
    const [updated] = await getDb()
      .update(listings)
      .set({ isActive: !listing.isActive })
      .where(eq(listings.id, id))
      .returning();

    return NextResponse.json({
      data: { id: updated.id, isActive: updated.isActive },
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
