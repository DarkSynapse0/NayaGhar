import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { listings } from "@/lib/db/schema";
import { withAnon, withRls } from "@/lib/db/rls";
import { generateEmbedding } from "@/lib/embeddings";
import { MAX_ESCROW_DEPOSIT_NPR, MAX_ESCROW_DEPOSIT_PAISA } from "@/lib/constants";
import type { ApiResponse } from "@/types/search";
import type { Listing, NewListing } from "@/types/listing";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    // Anonymous read context — `listings_select_visible` policy applies
    // (active OR owner). For non-owner anon users, only active rows return.
    if (id) {
      const listing = await withAnon(async (tx) => {
        const [row] = await tx
          .select()
          .from(listings)
          .where(eq(listings.id, id))
          .limit(1);
        return row;
      });

      if (!listing) {
        return NextResponse.json(
          { data: null, error: { code: "NOT_FOUND", message: "Listing not found" } },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: listing, error: null });
    }

    const allListings = await withAnon(async (tx) =>
      tx.select().from(listings).where(eq(listings.isActive, true)).limit(50)
    );

    return NextResponse.json({ data: allListings, error: null });
  } catch (error) {
    console.error("Listings fetch error:", error);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_ERROR", message: "Failed to fetch listings" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  try {
    const body: NewListing = await request.json();

    // Force the landlord_id to the session user — never trust client input here.
    body.landlordId = session.user.id;

    // Cap deposit so it stays within Esewa/Khalti per-transaction limits and
    // bounds platform exposure to SOL volatility on the held escrow.
    if (body.deposit && body.deposit > MAX_ESCROW_DEPOSIT_PAISA) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "DEPOSIT_TOO_LARGE",
            message: `Deposit cannot exceed Rs ${MAX_ESCROW_DEPOSIT_NPR.toLocaleString()} (Esewa/Khalti limit + platform cap).`,
          },
        },
        { status: 400 }
      );
    }

    let embedding: number[] | null = null;
    try {
      const embeddingText = [
        body.title,
        body.description,
        body.neighborhood,
        body.propertyType,
        body.amenities ? Object.keys(body.amenities).filter(k => body.amenities![k]).join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ");

      embedding = await generateEmbedding(embeddingText);
    } catch {
      console.warn("Embedding service unavailable, creating listing without embedding");
    }

    // listings_insert_landlord requires landlord_id = current_user_id
    const newListing = await withRls(session.user.id, async (tx) => {
      const [row] = await tx
        .insert(listings)
        .values({ ...body, embedding })
        .returning();
      return row;
    });

    const response: ApiResponse<Listing> = {
      data: newListing,
      error: null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Listing creation error:", error);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_ERROR", message: "Failed to create listing" } },
      { status: 500 }
    );
  }
}
