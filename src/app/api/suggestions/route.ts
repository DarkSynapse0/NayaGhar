import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { listings } from "@/lib/db/schema";
import { withAnon } from "@/lib/db/rls";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: { cities: [], listings: [] } });
  }

  const term = `%${q}%`;

  try {
    const data = await withAnon(async (tx) => {
      const matchingListings = await tx
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
              ilike(listings.neighborhood, term)
            )
          )
        )
        .limit(6);

      const matchingCities = await tx
        .selectDistinct({ city: listings.city })
        .from(listings)
        .where(and(eq(listings.isActive, true), ilike(listings.city, term)))
        .limit(3);

      return {
        cities: matchingCities.map((c) => c.city),
        listings: matchingListings,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: { cities: [], listings: [] } });
  }
}
