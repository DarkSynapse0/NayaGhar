import { notFound } from "next/navigation";
import { listings, reviews, users, escrows } from "@/lib/db/schema";
import { withAnon, withRls } from "@/lib/db/rls";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { ListingToggle } from "@/components/listing/ListingToggle";
import { ListingDetailMap } from "@/components/map/ListingDetailMap";
import { toNepaliDate } from "@/lib/nepali-date";
import Link from "next/link";
import { MediaGallery } from "@/components/listing/MediaGallery";
import { DepositCTA } from "@/components/listing/DepositCTA";
import { ReviewForm } from "@/components/listing/ReviewForm";
import { formatPrice, AMENITY_ICONS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import {
  BadgeCheck, MapPin, MessageCircle, Star, Shield, Phone,
  CalendarDays, Home, ArrowLeft, Camera, KeyRound, ArrowRight,
} from "lucide-react";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  // Owner needs to see their own inactive listings; everyone else is anon.
  const session = await auth();
  const ctx = session?.user?.id
    ? <T,>(fn: Parameters<typeof withRls<T>>[1]) => withRls<T>(session.user!.id!, fn)
    : <T,>(fn: Parameters<typeof withAnon<T>>[0]) => withAnon<T>(fn);

  let listing, landlord, listingReviews;
  try {
    const data = await ctx(async (tx) => {
      const [r] = await tx.select().from(listings).where(eq(listings.id, id)).limit(1);
      if (!r) return null;
      const [lr] = await tx.select().from(users).where(eq(users.id, r.landlordId)).limit(1);
      const lrev = await tx
        .select()
        .from(reviews)
        .where(eq(reviews.listingId, id))
        .orderBy(reviews.createdAt)
        .limit(20);
      return { listing: r, landlord: lr, listingReviews: lrev };
    });
    if (!data) notFound();
    listing = data.listing;
    landlord = data.landlord;
    listingReviews = data.listingReviews;
  } catch (error) {
    console.error("Failed to fetch listing details:", error);
    notFound();
  }

  const activeAmenities = listing.amenities
    ? Object.entries(listing.amenities).filter(([, v]) => v)
    : [];
  const avgRating = listingReviews.length
    ? (listingReviews.reduce((s, r) => s + r.rating, 0) / listingReviews.length).toFixed(1)
    : null;

  const isOwner = session?.user?.id === listing.landlordId;

  const userId = session?.user?.id;
  const myEscrows = userId
    ? await withRls(userId, async (tx) =>
        tx
          .select({
            id: escrows.id,
            state: escrows.state,
            createdAt: escrows.createdAt,
            moveOutDate: escrows.moveOutDate,
          })
          .from(escrows)
          .where(and(eq(escrows.tenantId, userId), eq(escrows.listingId, id)))
          .orderBy(desc(escrows.createdAt))
      )
    : [];
  const activeEscrow = myEscrows.find(
    (e) => e.state === "funded" || e.state === "fiat_settled" || e.state === "disputed"
  );
  const completedEscrow = myEscrows.find(
    (e) => e.state === "released" || e.state === "refunded" || e.state === "resolved"
  );
  const userReview = userId ? listingReviews.find((r) => r.reviewerId === userId) : null;
  const canReview = !!completedEscrow && !userReview;

  const mediaItems = [
    ...(listing.photos || []).map((p) => ({ type: "image" as const, url: p.url, alt: p.alt })),
    ...(listing.videos || []).map((v) => ({ type: "video" as const, url: v.url, thumbnail: v.thumbnail })),
  ];

  // One-tap WhatsApp contact — no account wall (top customer priority).
  const waDigits = landlord?.phone?.replace(/\D/g, "") ?? "";
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
        `Hi, I saw your listing "${listing.title}" on NayaGhar and I'm interested.`
      )}`
    : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
          {isOwner && <ListingToggle listingId={listing.id} initialActive={listing.isActive ?? true} />}
        </div>

        {/* Rented banner */}
        {!listing.isActive && (
          <div className="mb-5 rounded-[var(--radius)] bg-[var(--danger-wash)] border border-[var(--danger)]/30 px-4 py-3 text-sm font-medium text-[var(--danger)]">
            This property is marked as rented and hidden from search results.
          </div>
        )}

        {/* Your tenancy banner */}
        {(activeEscrow || completedEscrow) && (
          <Link
            href={`/escrow/${(activeEscrow ?? completedEscrow)!.id}`}
            className={`mb-5 flex items-center gap-3 rounded-[var(--radius)] border px-4 py-3 transition-colors ${
              activeEscrow
                ? "bg-[var(--verified-wash)] border-[var(--verified)]/30 text-[var(--verified)]"
                : "bg-[var(--geo-wash)] border-[var(--geo)]/30 text-[var(--geo)]"
            }`}
          >
            <KeyRound className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {activeEscrow ? "You're renting this place" : "You rented this place previously"}
              </p>
              <p className="text-[11px] opacity-80">
                {activeEscrow
                  ? `Deposit ${activeEscrow.state === "funded" ? "held by NayaGhar" : activeEscrow.state.replace("_", " ")} · view escrow`
                  : `Move-out ${completedEscrow!.moveOutDate ? new Date(completedEscrow!.moveOutDate).toLocaleDateString() : "completed"} · view escrow`}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </Link>
        )}

        {/* Media */}
        {mediaItems.length > 0 ? (
          <MediaGallery items={mediaItems} />
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--line)] h-52 sm:h-72 bg-[var(--paper-2)] dot-grid flex flex-col items-center justify-center text-[var(--ink-3)]">
            <Camera className="w-10 h-10 mb-2 opacity-40" />
            <p className="label">No photos or videos yet</p>
          </div>
        )}

        {/* Title + trust header */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {listing.isVerified && (
              <Badge variant="success"><BadgeCheck className="w-3.5 h-3.5" /> Verified</Badge>
            )}
            <Badge>{PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}</Badge>
            {avgRating && (
              <Badge variant="warning"><Star className="w-3.5 h-3.5" /> {avgRating}</Badge>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            {listing.title}
          </h1>

          <div className="flex items-start gap-1.5 mt-2 text-sm text-[var(--ink-2)]">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--geo)]" />
            <span>
              {listing.address}
              {listing.neighborhood && ` · ${listing.neighborhood}`} · {listing.city}
            </span>
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            <section>
              <p className="label text-[var(--ink-3)] mb-3">About this place</p>
              <p className="text-[var(--ink-2)] whitespace-pre-line leading-relaxed max-w-[68ch]">
                {listing.description}
              </p>
            </section>

            {/* Amenities */}
            {activeAmenities.length > 0 && (
              <section>
                <p className="label text-[var(--ink-3)] mb-3">What&apos;s included</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeAmenities.map(([key]) => {
                    const Icon = AMENITY_ICONS[key] || Shield;
                    return (
                      <div key={key} className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)]">
                        <Icon className="w-4 h-4 text-[var(--brick)] flex-shrink-0" />
                        <span className="text-sm font-medium text-[var(--ink)]">{key}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location / map — prominent */}
            <section>
              <p className="label text-[var(--geo)] mb-3">Location</p>
              <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--ink)] h-64 sm:h-80">
                <ListingDetailMap latitude={listing.latitude} longitude={listing.longitude} title={listing.title} />
              </div>
              <p className="mt-2 text-xs text-[var(--ink-3)]">
                Approximate location · {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}
              </p>
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <p className="label text-[var(--ink-3)]">Reviews ({listingReviews.length})</p>
                {avgRating && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className="w-4 h-4 text-[var(--pending)] fill-[var(--pending)]" />
                    <span className="price-display font-bold text-[var(--ink)]">{avgRating}</span>
                    <span className="text-[var(--ink-3)]">/ 5</span>
                  </div>
                )}
              </div>

              {canReview && <ReviewForm listingId={listing.id} />}

              {listingReviews.length === 0 ? (
                <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] text-center">
                  <Star className="w-8 h-8 mx-auto text-[var(--ink-3)] opacity-40 mb-2" />
                  <p className="text-sm text-[var(--ink-2)]">{canReview ? "Be the first to review" : "No reviews yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {listingReviews.map((review) => (
                    <div key={review.id} className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] p-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-[var(--pending)] fill-[var(--pending)]" : "text-[var(--line)]"}`} />
                          ))}
                        </div>
                        {review.isVerifiedStay && (
                          <Badge variant="success"><BadgeCheck className="w-3 h-3" /> Verified stay</Badge>
                        )}
                      </div>
                      {review.text && (
                        <p className="mt-3 text-sm text-[var(--ink-2)] leading-relaxed">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sticky action rail */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Price + contact */}
              <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--ink)] p-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="price-display text-3xl font-black text-[var(--ink)]">{formatPrice(listing.priceMonthly)}</span>
                  <span className="text-sm text-[var(--ink-3)]">/month</span>
                </div>
                {listing.deposit && (
                  <p className="mt-1 text-sm text-[var(--ink-2)]">
                    Deposit <span className="price-display font-semibold text-[var(--ink)]">{formatPrice(listing.deposit)}</span>
                  </p>
                )}

                {!isOwner && (
                  <div className="mt-4 space-y-2">
                    {waHref ? (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-[var(--radius)] bg-[var(--whatsapp)] text-white font-display font-bold shadow-block active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform"
                      >
                        <MessageCircle className="w-5 h-5" /> Message on WhatsApp
                      </a>
                    ) : (
                      <div className="flex items-center justify-center gap-2 w-full h-12 rounded-[var(--radius)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)] font-display font-bold">
                        <MessageCircle className="w-5 h-5" /> Contact unavailable
                      </div>
                    )}
                    {listing.deposit && listing.isActive && (
                      <DepositCTA
                        listingId={listing.id}
                        listingTitle={listing.title}
                        depositPaisa={listing.deposit}
                        isAuthenticated={!!session?.user?.id}
                      />
                    )}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-[var(--ink-3)] leading-relaxed">
                  Always visit in person before paying. NayaGhar holds deposits in escrow until you move in.
                </p>
              </div>

              {/* Landlord trust card */}
              <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] p-5">
                <p className="label text-[var(--ink-3)] mb-3">Listed by</p>
                {landlord ? (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[var(--radius)] bg-[var(--brick-wash)] flex items-center justify-center text-[var(--brick)] font-display font-bold text-lg">
                      {landlord.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)] truncate">{landlord.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {landlord.isPhoneVerified && (
                          <span className="inline-flex items-center gap-1 label text-[var(--verified)]">
                            <Phone className="w-3 h-3" /> Phone verified
                          </span>
                        )}
                        {landlord.trustScore && Number(landlord.trustScore) > 0 && (
                          <span className="label text-[var(--ink-3)]">Trust {landlord.trustScore}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--ink-3)]">Unavailable</p>
                )}
              </div>

              {/* Details */}
              <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] p-5">
                <p className="label text-[var(--ink-3)] mb-3">Details</p>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-[var(--ink-2)]"><Home className="w-4 h-4" /> Type</dt>
                    <dd className="font-semibold text-[var(--ink)] capitalize">{listing.propertyType}</dd>
                  </div>
                  {listing.availableFrom && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-[var(--ink-2)]"><CalendarDays className="w-4 h-4" /> Available</dt>
                      <dd className="font-semibold text-[var(--ink)]">{toNepaliDate(listing.availableFrom)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
