import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { escrows, listings, reviews } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";

export const dynamic = "force-dynamic";

type Body = {
  listingId: string;
  rating: number;
  text?: string;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BAD_JSON", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  if (!body.listingId || !body.rating) {
    return NextResponse.json(
      { data: null, error: { code: "MISSING_FIELDS", message: "listingId + rating required" } },
      { status: 400 }
    );
  }
  if (body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_RATING", message: "Rating must be 1-5" } },
      { status: 400 }
    );
  }

  // Run inside the user's RLS context so the verified-stay policy enforces too —
  // the explicit checks below give us clean error messages instead of opaque
  // RLS rejections.
  const result = await withRls(session.user.id, async (tx) => {
    const [listing] = await tx
      .select({ id: listings.id, landlordId: listings.landlordId })
      .from(listings)
      .where(eq(listings.id, body.listingId))
      .limit(1);
    if (!listing) return { kind: "no_listing" as const };
    if (listing.landlordId === session.user!.id!) {
      return { kind: "own_listing" as const };
    }

    // Verified-stay check: must have a completed escrow on this listing.
    const [eligibleEscrow] = await tx
      .select({ id: escrows.id })
      .from(escrows)
      .where(
        and(
          eq(escrows.listingId, body.listingId),
          eq(escrows.tenantId, session.user!.id!),
          inArray(escrows.state, ["released", "refunded", "resolved"])
        )
      )
      .limit(1);
    if (!eligibleEscrow) return { kind: "not_a_tenant" as const };

    // One review per (reviewer, listing).
    const [existing] = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.listingId, body.listingId),
          eq(reviews.reviewerId, session.user!.id!)
        )
      )
      .limit(1);
    if (existing) return { kind: "already_reviewed" as const };

    const [newReview] = await tx
      .insert(reviews)
      .values({
        listingId: body.listingId,
        reviewerId: session.user!.id!,
        rating: body.rating,
        text: body.text?.trim() || null,
        isVerifiedStay: true,
      })
      .returning();
    return { kind: "ok" as const, review: newReview };
  });

  switch (result.kind) {
    case "no_listing":
      return NextResponse.json(
        { data: null, error: { code: "LISTING_NOT_FOUND", message: "Listing missing" } },
        { status: 404 }
      );
    case "own_listing":
      return NextResponse.json(
        { data: null, error: { code: "OWN_LISTING", message: "You can't review your own listing" } },
        { status: 400 }
      );
    case "not_a_tenant":
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "NOT_VERIFIED_STAY",
            message: "Only past tenants can review this property",
          },
        },
        { status: 403 }
      );
    case "already_reviewed":
      return NextResponse.json(
        {
          data: null,
          error: { code: "ALREADY_REVIEWED", message: "You've already reviewed this property" },
        },
        { status: 409 }
      );
    case "ok":
      return NextResponse.json({ data: result.review, error: null }, { status: 201 });
  }
}
