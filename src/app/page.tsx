import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { HomeMapSection } from "@/components/map/HomeMapSection";
import { FadeIn } from "@/components/ui/AnimatedSection";
import { ListingCard } from "@/components/listing/ListingCard";
import { listings } from "@/lib/db/schema";
import { withAnon } from "@/lib/db/rls";
import { desc, eq } from "drizzle-orm";
import { RegisterButton } from "@/components/ui/ListPropertyButton";
import { CITIES, FEATURED_CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { Search, ArrowRight, BadgeCheck, MessageCircle, MapPin } from "lucide-react";

export default async function HomePage() {
  let allListings: (typeof listings.$inferSelect)[] = [];
  try {
    allListings = await withAnon(async (tx) =>
      tx
        .select()
        .from(listings)
        .where(eq(listings.isActive, true))
        .orderBy(desc(listings.createdAt))
        .limit(50)
    );
  } catch (error) {
    console.error("Failed to fetch listings for home page:", error);
  }

  const verifiedCount = allListings.filter((l) => l.isVerified).length;
  const cityCount = new Set(allListings.map((l) => l.city)).size || CITIES.length;
  const recent = allListings.slice(0, 6);

  const steps = [
    {
      n: "01",
      title: "Search your area",
      body: "Filter by city, price and property type, or browse the map near your college or workplace.",
    },
    {
      n: "02",
      title: "Check the verified badge",
      body: "Verified listings have confirmed photos and a phone-verified landlord. Read reviews from real tenants.",
    },
    {
      n: "03",
      title: "Message on WhatsApp",
      body: "Contact the landlord directly, no account or app download needed. Ask, visit, and decide.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="h-14" />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative border-b-2 border-[var(--ink)] dot-grid">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
          <FadeIn>
            <p className="label text-[var(--brick)]">Verified housing · Nepal</p>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="mt-5 font-display font-black leading-[0.95] tracking-tight text-[clamp(2.6rem,7vw,5.25rem)] max-w-4xl">
              Find a room
              <br />
              you can trust.
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg text-[var(--ink-2)] max-w-xl leading-relaxed">
              Real photos, honest prices, phone-verified landlords. Rooms,
              apartments, PG and hostels for students and young professionals
              moving to the city.
            </p>
          </FadeIn>

          {/* No-JS search form — works on any connection */}
          <FadeIn delay={0.15}>
            <form
              action="/search"
              className="mt-9 max-w-2xl bg-[var(--panel)] border border-[var(--ink)] rounded-[var(--radius-lg)] shadow-block p-2 flex flex-col sm:flex-row gap-2"
            >
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-[var(--ink-3)] shrink-0" />
                <input
                  name="q"
                  type="text"
                  placeholder="Area, landmark, or keyword"
                  aria-label="Search rooms"
                  className="h-11 w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  name="city"
                  aria-label="City"
                  defaultValue=""
                  className="h-11 rounded-[var(--radius)] bg-[var(--paper-2)] border border-[var(--line)] px-3 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brick)]"
                >
                  <option value="">All cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-[var(--radius)] bg-[var(--brick)] text-[var(--panel)] font-display font-bold text-sm hover:bg-[var(--brick-ink)] transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </form>
          </FadeIn>

          {/* Property type directory */}
          <FadeIn delay={0.2}>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="label text-[var(--ink-3)] mr-1">Browse</span>
              {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
                <Link
                  key={value}
                  href={`/search?type=${value}`}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)] text-[13px] font-semibold text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Trust strip */}
        <div className="border-t-2 border-[var(--ink)] bg-[var(--panel)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--line)]">
            {[
              { value: `${allListings.length}`, label: "Live listings" },
              { value: `${verifiedCount}`, label: "Verified" },
              { value: `${cityCount}`, label: "Cities" },
              { value: "Free", label: "For landlords" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`py-6 ${i === 0 ? "" : "pl-5"}`}>
                <p className="price-display text-3xl font-extrabold text-[var(--ink)]">{value}</p>
                <p className="label text-[var(--ink-3)] mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Map ─────────────────────────────────────────────── */}
      <section className="border-b-2 border-[var(--ink)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="label text-[var(--geo)]">On the map</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                See what&apos;s near you
              </h2>
            </div>
            <Link
              href="/search"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] hover:text-[var(--brick)] transition-colors"
            >
              Open full map <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--ink)] relative">
            <div className="h-[380px] sm:h-[480px]">
              <HomeMapSection listings={allListings} />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[var(--paper)] via-[var(--paper)]/70 to-transparent pointer-events-none">
              <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
                {FEATURED_CITIES.map((city) => (
                  <Link
                    key={city}
                    href={`/search?city=${city}`}
                    className="label px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--panel)] border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--brick)] hover:text-[var(--panel)] hover:border-[var(--brick)] transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Available now ───────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="border-b-2 border-[var(--ink)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="label text-[var(--brick)]">Available now</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Recently listed rooms
                </h2>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] hover:text-[var(--brick)] transition-colors"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ────────────────────────────────────── */}
      <section className="border-b-2 border-[var(--ink)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-16">
          <p className="label text-[var(--ink-3)]">How it works</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight max-w-lg">
            Three steps to a place that&apos;s actually real
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 border border-[var(--ink)] rounded-[var(--radius-lg)] overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[var(--ink)]">
            {steps.map(({ n, title, body }, i) => {
              const Icon = [Search, BadgeCheck, MessageCircle][i];
              return (
                <div key={n} className="p-6 bg-[var(--panel)]">
                  <div className="flex items-center justify-between">
                    <span className="price-display text-4xl font-black text-[var(--brick)]">{n}</span>
                    <Icon className="w-6 h-6 text-[var(--ink-3)]" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-[var(--ink)]">{title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-2)] leading-relaxed">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Landlord CTA (brick block) ──────────────────────── */}
      <section className="bg-[var(--brick)] text-[var(--panel)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="label text-[var(--panel)]/80">For landlords</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              List your property, reach thousands of renters.
            </h2>
            <p className="mt-4 text-[var(--panel)]/85 leading-relaxed max-w-md">
              Connect with reliable students and professionals looking for housing
              across Nepal. Listing is completely free.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <RegisterButton
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[var(--radius)] bg-[var(--panel)] text-[var(--brick)] font-display font-bold hover:bg-[var(--paper)] transition-colors"
                label="List for free"
              />
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[var(--radius)] border border-[var(--panel)]/60 text-[var(--panel)] font-display font-bold hover:bg-[var(--panel)]/10 transition-colors"
              >
                Browse listings
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 flex-wrap text-sm text-[var(--panel)]/85">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="w-4 h-4" /> 100% free</span>
              <span className="inline-flex items-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp inquiries</span>
              <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> Map placement</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
