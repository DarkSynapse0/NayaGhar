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
import { ListingActions } from "@/components/listing/ListingActions";
import { formatPrice, AMENITY_ICONS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import {
  BadgeCheck, MapPin, MessageCircle, Star, Shield, Phone,
  CalendarDays, Home, ArrowLeft, Camera, KeyRound, ArrowRight, Check,
} from "lucide-react";

// Amenities organised into named groups (reference "Features" layout).
const FEATURE_GROUPS = [
  { title: "Connectivity", keys: ["WiFi"] },
  { title: "Comfort", keys: ["AC", "Furnished"] },
  { title: "Kitchen & Laundry", keys: ["Kitchen", "Laundry"] },
  { title: "Utilities", keys: ["Power Backup", "Water Supply"] },
  { title: "Parking & Access", keys: ["Parking"] },
  { title: "Safety", keys: ["Security", "CCTV"] },
];

// The "how renting works" steps shown in the booking rail.
const RENT_STEPS = [
  { t: "Message the landlord", d: "Contact on WhatsApp, ask your questions and arrange a visit." },
  { t: "Visit and confirm", d: "See the room in person before you pay anything." },
  { t: "Pay the deposit safely", d: "NayaGhar holds your deposit in escrow until you move in." },
];

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
  const amenitySet = new Set(activeAmenities.map(([k]) => k));
  const featureGroups = FEATURE_GROUPS
    .map((g) => ({ title: g.title, items: g.keys.filter((k) => amenitySet.has(k)) }))
    .filter((g) => g.items.length > 0);
  const includedChecklist = ["WiFi", "Water Supply", "Power Backup", "Furnished"].filter((k) => amenitySet.has(k));
  const avgRating = listingReviews.length
    ? (listingReviews.reduce((s, r) => s + r.rating, 0) / listingReviews.length).toFixed(1)
    : null;
  const ratingRounded = avgRating ? Math.round(Number(avgRating)) : 0;

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

        {/* Header — rating, title, location, actions (above gallery) */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              {avgRating ? (
                <>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < ratingRounded ? "text-[var(--pending)] fill-[var(--pending)]" : "text-[var(--line)]"}`} />
                    ))}
                  </div>
                  <span className="price-display font-bold text-[var(--ink)]">{avgRating}</span>
                  <span className="text-[var(--ink-3)]">· {listingReviews.length} {listingReviews.length === 1 ? "review" : "reviews"}</span>
                </>
              ) : (
                <span className="label text-[var(--brick)]">New listing</span>
              )}
            </div>

            <h1 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
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

          <div className="hidden sm:block">
            <ListingActions listingId={listing.id} title={listing.title} />
          </div>
        </div>

        {/* Media gallery */}
        {mediaItems.length > 0 ? (
          <MediaGallery items={mediaItems} />
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--line)] h-52 sm:h-72 bg-[var(--paper-2)] dot-grid flex flex-col items-center justify-center text-[var(--ink-3)]">
            <Camera className="w-10 h-10 mb-2 opacity-40" />
            <p className="label">No photos or videos yet</p>
          </div>
        )}

        {/* Content grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview meta */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm pb-6 border-b border-[var(--line)]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                <Home className="w-4 h-4 text-[var(--brick)]" /> {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
              </span>
              {listing.isVerified && (
                <span className="inline-flex items-center gap-1.5 text-[var(--verified)] font-semibold">
                  <BadgeCheck className="w-4 h-4" /> Verified listing
                </span>
              )}
              {listing.availableFrom && (
                <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
                  <CalendarDays className="w-4 h-4" /> Available {toNepaliDate(listing.availableFrom)}
                </span>
              )}
            </div>

            {/* About */}
            <section>
              <p className="label text-[var(--brick)]">About</p>
              <h2 className="mt-1.5 mb-3 font-display text-xl font-bold tracking-tight">About this place</h2>
              <p className="text-[var(--ink-2)] whitespace-pre-line leading-relaxed max-w-[68ch]">
                {listing.description}
              </p>
            </section>

            {/* Features — grouped by category */}
            {featureGroups.length > 0 && (
              <section>
                <p className="label text-[var(--brick)]">Features</p>
                <h2 className="mt-1.5 mb-4 font-display text-xl font-bold tracking-tight">What this place offers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                  {featureGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="text-sm font-bold text-[var(--ink)]">{group.title}</h3>
                      <ul className="mt-2.5 space-y-2">
                        {group.items.map((key) => {
                          const Icon = AMENITY_ICONS[key] || Shield;
                          return (
                            <li key={key} className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                              <Icon className="w-4 h-4 text-[var(--brick)] shrink-0" /> {key}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location / map — prominent */}
            <section>
              <p className="label text-[var(--geo)]">Location</p>
              <h2 className="mt-1.5 mb-3 font-display text-xl font-bold tracking-tight">Where you&apos;ll be</h2>
              <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--ink)] h-64 sm:h-80">
                <ListingDetailMap latitude={listing.latitude} longitude={listing.longitude} title={listing.title} />
              </div>
              <p className="mt-2 text-xs text-[var(--ink-3)]">
                Approximate location · {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}
              </p>
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="label text-[var(--brick)]">Reviews</p>
                  <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">What tenants say ({listingReviews.length})</h2>
                </div>
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
                  <span className="price-display text-3xl font-black text-[var(--brick)]">{formatPrice(listing.priceMonthly)}</span>
                  <span className="text-sm text-[var(--ink-3)]">/month</span>
                </div>
                {listing.deposit ? (
                  <p className="mt-1 text-sm text-[var(--ink-2)]">
                    Deposit <span className="price-display font-semibold text-[var(--ink)]">{formatPrice(listing.deposit)}</span>
                  </p>
                ) : null}

                {includedChecklist.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {includedChecklist.map((k) => (
                      <li key={k} className="flex items-center gap-2 text-sm text-[var(--ink-2)]">
                        <Check className="w-4 h-4 text-[var(--verified)] shrink-0" /> {k} included
                      </li>
                    ))}
                  </ul>
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

                <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-1.5 text-[12px] text-[var(--ink-2)]">
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--verified)]" /> No charge until you move in</p>
                  <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--verified)]" /> Deposit held in escrow by NayaGhar</p>
                </div>
              </div>

              {/* How renting works */}
              <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--line)] p-5">
                <p className="label text-[var(--brick)] mb-4">How renting works</p>
                <ol className="space-y-4">
                  {RENT_STEPS.map((s, i) => (
                    <li key={s.t} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brick-wash)] text-[var(--brick)] font-display font-bold text-xs flex items-center justify-center">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">{s.t}</p>
                        <p className="mt-0.5 text-[13px] text-[var(--ink-2)] leading-relaxed">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
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

              {/* Save / Share on mobile (header actions are desktop-only) */}
              <div className="sm:hidden">
                <ListingActions listingId={listing.id} title={listing.title} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
