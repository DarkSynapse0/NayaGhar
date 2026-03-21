import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: { cities: [], listings: [] } });
  }

  const term = `%${q}%`;

  try {
    const matchingListings = await getDb()
      .select({
        id: listings.id,
        title: listings.title,
        city: listings.city,
        neighborhood: listings.neighborhood,
        propertyType: listings.propertyType,
        priceMonthly: listings.priceMonthly,
      })
      .from(listings)
      .where(
        and(
          eq(listings.isActive, true),
          or(
            ilike(listings.title, term),
            ilike(listings.city, term),
            ilike(listings.neighborhood, term),
          ),
        )
      )
      .limit(6);

    const matchingCities = await getDb()
      .selectDistinct({ city: listings.city })
      .from(listings)
      .where(
        and(
          eq(listings.isActive, true),
          ilike(listings.city, term),
        )
      )
      .limit(3);

    return NextResponse.json({
      data: {
        cities: matchingCities.map((c) => c.city),
        listings: matchingListings,
      },
    });
  } catch {
    return NextResponse.json({ data: { cities: [], listings: [] } });
  }
}
