import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateEmbedding } from "@/lib/embeddings";
import type { ApiResponse } from "@/types/search";
import type { Listing, NewListing } from "@/types/listing";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const [listing] = await getDb()
        .select()
        .from(listings)
        .where(eq(listings.id, id))
        .limit(1);

      if (!listing) {
        return NextResponse.json(
          { data: null, error: { code: "NOT_FOUND", message: "Listing not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: listing, error: null });
    }

    const allListings = await getDb()
      .select()
      .from(listings)
      .where(eq(listings.isActive, true))
      .limit(50);

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
  try {
    const body: NewListing = await request.json();

    // Generate embedding from listing content (graceful fallback if service is down)
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
      // Embedding service unavailable — listing still works, just no semantic search
      console.warn("Embedding service unavailable, creating listing without embedding");
    }

    const [newListing] = await getDb()
      .insert(listings)
      .values({ ...body, embedding })
      .returning();

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
