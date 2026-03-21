import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { listings, reviews, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { ListingToggle } from "@/components/listing/ListingToggle";
import { Button } from "@/components/ui/Button";
import { ListingDetailMap } from "@/components/map/ListingDetailMap";
import { toNepaliDate } from "@/lib/nepali-date";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Star, Shield, Phone, CalendarDays, Home, ArrowLeft, Wifi, Snowflake, WashingMachine, UtensilsCrossed, Car, Zap, Droplets, Sofa, Camera } from "lucide-react";

function formatPrice(paisa: number): string { return `Rs. ${(paisa / 100).toLocaleString()}`; }
const amenityIcons: Record<string, typeof Wifi> = { WiFi: Wifi, AC: Snowflake, Laundry: WashingMachine, Kitchen: UtensilsCrossed, Parking: Car, "Power Backup": Zap, "Water Supply": Droplets, Furnished: Sofa, Security: Shield, CCTV: Camera };

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  let listing, landlord, listingReviews;
  try {
    const [r] = await getDb().select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!r) notFound(); listing = r;
    const [lr] = await getDb().select().from(users).where(eq(users.id, listing.landlordId)).limit(1);
    landlord = lr;
    listingReviews = await getDb().select().from(reviews).where(eq(reviews.listingId, id)).orderBy(reviews.createdAt).limit(20);
  } catch { notFound(); }

  const activeAmenities = listing.amenities ? Object.entries(listing.amenities).filter(([, v]) => v) : [];
  const avgRating = listingReviews.length ? (listingReviews.reduce((s, r) => s + r.rating, 0) / listingReviews.length).toFixed(1) : null;

  const session = await auth();
  const isOwner = session?.user?.id === listing.landlordId;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-5">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to search
          </Link>
          {isOwner && (
            <ListingToggle listingId={listing.id} initialActive={listing.isActive ?? true} />
          )}
        </div>

        {/* Rented banner */}
        {!listing.isActive && (
          <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 text-center">
            This property is currently marked as rented and not visible in search results.
          </div>
        )}

        {/* Photos */}
        <div className="rounded-2xl overflow-hidden border border-[var(--border)]">
          {listing.photos && listing.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
              {listing.photos.map((photo, i) => (
                <div key={i} className={`bg-[var(--bg-elevated)] ${i === 0 ? "col-span-2 sm:row-span-2 h-52 sm:h-[400px]" : "h-32 sm:h-[198px]"}`}>
                  <img src={photo.url} alt={photo.alt || `Photo ${i + 1}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" loading={i === 0 ? "eager" : "lazy"} />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-52 sm:h-72 bg-[var(--bg-elevated)] flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Camera className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm">No photos</p>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {listing.isVerified && <Badge variant="success"><BadgeCheck className="w-3 h-3" /> Verified</Badge>}
            <Badge className="capitalize">{listing.propertyType}</Badge>
            {avgRating && <Badge variant="warning"><Star className="w-3 h-3" /> {avgRating}</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{listing.title}</h1>
          <div className="flex items-center gap-1.5 mt-2 text-sm text-[var(--text-muted)]">
            <MapPin className="w-4 h-4 flex-shrink-0" />{listing.address}{listing.neighborhood && ` · ${listing.neighborhood}`} · {listing.city}
          </div>
        </div>

        {/* Price bar */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-[50px]" />
          <div className="flex-1 relative">
            <p className="price-display text-3xl sm:text-4xl font-extrabold text-[var(--accent)]">{formatPrice(listing.priceMonthly)}<span className="text-base font-normal text-[var(--text-muted)] ml-1">/month</span></p>
            {listing.deposit && <p className="text-sm text-[var(--text-muted)] mt-1">Deposit: {formatPrice(listing.deposit)}</p>}
          </div>
          <Button variant="whatsapp" size="lg" className="sm:w-auto w-full"><MessageCircle className="w-5 h-5" /> Message on WhatsApp</Button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-3">About</p>
              <p className="text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{listing.description}</p>
            </section>

            {activeAmenities.length > 0 && (
              <section>
                <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-3">Amenities</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeAmenities.map(([key]) => { const Icon = amenityIcons[key] || Shield; return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"><Icon className="w-4 h-4 text-[var(--accent)] flex-shrink-0" /><span className="text-sm font-medium">{key}</span></div>
                  ); })}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase">Reviews ({listingReviews.length})</p>
                {avgRating && <div className="flex items-center gap-1.5 text-sm"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="font-bold">{avgRating}</span><span className="text-[var(--text-muted)]">/ 5</span></div>}
              </div>
              {listingReviews.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-center"><Star className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-20 mb-2" /><p className="text-sm text-[var(--text-muted)]">No reviews yet</p></div>
              ) : (
                <div className="space-y-3">
                  {listingReviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-white/5"}`} />))}</div>
                        {review.isVerifiedStay && <Badge variant="success"><BadgeCheck className="w-3 h-3" /> Verified Stay</Badge>}
                      </div>
                      {review.text && <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">{review.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-3">Listed by</p>
              {landlord ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] font-bold">{landlord.name.charAt(0).toUpperCase()}</div>
                  <div><p className="font-semibold">{landlord.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {landlord.isPhoneVerified && <span className="flex items-center gap-1 text-xs text-emerald-400"><Phone className="w-3 h-3" /> Verified</span>}
                      {landlord.trustScore && <span className="text-xs text-[var(--text-muted)]">Trust: {landlord.trustScore}</span>}
                    </div>
                  </div>
                </div>
              ) : <p className="text-sm text-[var(--text-muted)]">Unavailable</p>}
            </div>

            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5">
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-3">Details</p>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-[var(--text-muted)]"><Home className="w-4 h-4" /> Type</dt><dd className="font-semibold capitalize">{listing.propertyType}</dd></div>
                {listing.availableFrom && <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-[var(--text-muted)]"><CalendarDays className="w-4 h-4" /> Available</dt><dd className="font-semibold">{toNepaliDate(listing.availableFrom)}</dd></div>}
              </dl>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[var(--border)] h-48 sm:h-56">
              <ListingDetailMap latitude={listing.latitude} longitude={listing.longitude} title={listing.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
