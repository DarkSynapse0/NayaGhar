import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { HomeSearchMap } from "@/components/search/HomeSearchMap";
import { FadeIn } from "@/components/ui/AnimatedSection";
import { ListingCard } from "@/components/listing/ListingCard";
import { listings } from "@/lib/db/schema";
import { withAnon } from "@/lib/db/rls";
import { desc, eq } from "drizzle-orm";
import { RegisterButton } from "@/components/ui/ListPropertyButton";
import { CITIES, formatPriceValue } from "@/lib/constants";
import {
  Search, MapPin, ShieldCheck, Sparkles, BadgeCheck, Star, MessageCircle,
  Languages, ArrowRight, ArrowUpRight, CheckCircle2, Quote, Wallet, Building2,
} from "lucide-react";

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
  const priced = allListings.filter((l) => l.priceMonthly > 0);
  const avgRentPaisa = priced.length
    ? Math.round(priced.reduce((s, l) => s + l.priceMonthly, 0) / priced.length)
    : 0;
  const verifiedPct = allListings.length ? Math.round((verifiedCount / allListings.length) * 100) : 0;
  const featured = allListings.filter((l) => l.photos && l.photos.length > 0).slice(0, 6);
  const featuredGrid = featured.length ? featured : allListings.slice(0, 6);

  // 3 — Curated approach pillars
  const pillars = [
    { icon: ShieldCheck, title: "Verified properties", body: "Confirmed photos and phone-verified landlords, so what you see is what you get." },
    { icon: MapPin, title: "Prime locations", body: "Rooms close to colleges, offices and transit, in the neighborhoods you actually want." },
    { icon: Sparkles, title: "Curated listings", body: "Real photos and honest prices only. No agents, no bait, no surprises." },
    { icon: Search, title: "Smart search", body: "Filter by budget and type, or explore the map to find places near you." },
  ];

  // 5 — What we offer
  const offers = [
    { icon: BadgeCheck, title: "Verification you can rely on", body: "Every verified listing has confirmed photos and a phone-verified owner." },
    { icon: Star, title: "Reviews from real tenants", body: "Read honest experiences from people who actually stayed there before you decide." },
    { icon: MessageCircle, title: "One-tap WhatsApp contact", body: "Reach the landlord directly. No account, no middleman, no app download needed." },
    { icon: Languages, title: "Built for Nepal", body: "Bilingual and light on data, so it works on any phone and any connection." },
  ];

  // 7 — Decision support checklist
  const checks = [
    "Look for the green verified badge",
    "Compare the price against the area average",
    "Read tenant reviews before you visit",
    "Message on WhatsApp and ask your questions",
  ];

  // 8 — Testimonials (representative)
  const testimonials = [
    { quote: "I found a verified room near my college in three days. The photos were real and the landlord replied on WhatsApp within minutes.", name: "Sita Gurung", role: "Student, Kathmandu" },
    { quote: "Moving from my village felt scary, but honest prices and real reviews let me trust a place before I ever visited it.", name: "Bibek Thapa", role: "IT professional, Lalitpur" },
    { quote: "No agent fees and no fake listings. I compared a few rooms on the map and picked one close to my office.", name: "Anisha Shrestha", role: "Nurse, Pokhara" },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />
      <div className="h-14" />

      {/* ── 1 · Hero (value proposition first) ───────────────── */}
      <section className="relative border-b-2 border-[var(--ink)] dot-grid">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24 text-center">
          <FadeIn>
            <p className="label text-[var(--brick)]">Verified housing · Nepal</p>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="mx-auto mt-6 font-display font-black leading-[0.98] tracking-tight text-[clamp(2.6rem,7vw,5rem)] max-w-4xl">
              A smarter way to find
              <br />
              your place in the city.
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-6 text-lg text-[var(--ink-2)] max-w-xl leading-relaxed">
              Rooms, apartments, PG and hostels you can actually trust. Real photos,
              honest prices and phone-verified landlords, for students and young
              professionals moving to the city.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[var(--radius)] bg-[var(--brick)] text-[var(--panel)] font-display font-bold shadow-block hover:bg-[var(--brick-ink)] transition-colors"
              >
                Browse rooms <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#offer"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--ink)] text-[var(--ink)] font-display font-bold hover:bg-[var(--paper-2)] transition-colors"
              >
                How it works
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 2 · Search + map (split: results left, map right) ── */}
      <section id="search" className="border-b-2 border-[var(--ink)] bg-[var(--panel)] scroll-mt-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16">
          <div className="mb-7 max-w-xl">
            <p className="label text-[var(--geo)]">Search the map</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Search a place, see it on the map
            </h2>
            <p className="mt-2 text-[var(--ink-2)]">
              Pick a type, area and budget, or type a place. Matching rooms appear as pins on the map. Tap one to see it.
            </p>
          </div>

          <HomeSearchMap listings={allListings} />
        </div>
      </section>

      {/* ── 3 · Curated approach (feature pillars) ───────────── */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="label text-[var(--brick)]">Our curated approach</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Built around the one question that matters
            </h2>
            <p className="mt-2 text-[var(--ink-2)]">
              Not just &ldquo;what&apos;s available&rdquo;, but &ldquo;is this the right place for me?&rdquo;
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map(({ icon: Icon, title, body }) => (
              <div key={title} className="panel p-5">
                <div className="w-11 h-11 rounded-[var(--radius)] bg-[var(--brick-wash)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--brick)]" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-1.5 text-sm text-[var(--ink-2)] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · Featured properties ──────────────────────────── */}
      {featuredGrid.length > 0 && (
        <section className="border-b border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="label text-[var(--brick)]">Featured</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Rooms worth a closer look
                </h2>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] hover:text-[var(--brick)] transition-colors"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredGrid.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5 · What we offer ────────────────────────────────── */}
      <section id="offer" className="border-b border-[var(--line)] scroll-mt-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
            <div className="lg:sticky lg:top-20 self-start">
              <p className="label text-[var(--brick)]">What we offer</p>
              <h2 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.05]">
                Support that goes beyond the listing
              </h2>
              <p className="mt-4 text-[var(--ink-2)] leading-relaxed max-w-md">
                Finding a place far from home is stressful. We stay with you through the
                whole decision, not just the search, so you can move in with confidence.
              </p>
              <Link
                href="/search"
                className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-[var(--radius)] bg-[var(--brick)] text-[var(--panel)] font-display font-bold hover:bg-[var(--brick-ink)] transition-colors"
              >
                Start exploring <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {offers.map(({ icon: Icon, title, body }) => (
                <div key={title} className="panel p-5">
                  <Icon className="w-5 h-5 text-[var(--brick)]" />
                  <h3 className="mt-3 font-display text-base font-bold text-[var(--ink)]">{title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--ink-2)] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 · Decision support (reassurance + data) ────────── */}
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="label text-[var(--brick)]">Decide with confidence</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              The numbers and checks that settle the doubt
            </h2>
            <p className="mt-2 text-[var(--ink-2)]">
              A little context goes a long way. Here is what to weigh before you commit.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16">
            {/* Data tiles */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Wallet, value: avgRentPaisa ? `Rs ${formatPriceValue(avgRentPaisa)}` : "—", label: "Average monthly rent" },
                { icon: ShieldCheck, value: `${verifiedPct}%`, label: "Listings verified" },
                { icon: Building2, value: `${cityCount}`, label: "Cities covered" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="panel p-5 flex flex-col">
                  <Icon className="w-5 h-5 text-[var(--brick)]" />
                  <p className="price-display mt-4 text-2xl sm:text-3xl font-extrabold text-[var(--ink)] leading-none">{value}</p>
                  <p className="mt-2 text-[13px] text-[var(--ink-3)] leading-snug">{label}</p>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div>
              <p className="label text-[var(--ink-3)]">Before you commit</p>
              <ul className="mt-4 space-y-3">
                {checks.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--verified)] shrink-0 mt-0.5" />
                    <span className="text-[15px] text-[var(--ink)] leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8 · Testimonials ─────────────────────────────────── */}
      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="label text-[var(--brick)]">In their words</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              People who found their place
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(({ quote, name, role }) => (
              <figure key={name} className="panel p-6 flex flex-col">
                <Quote className="w-6 h-6 text-[var(--brick)]" />
                <blockquote className="mt-4 text-[15px] text-[var(--ink)] leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 pt-4 border-t border-[var(--line)]">
                  <span className="block font-display font-bold text-[var(--ink)]">{name}</span>
                  <span className="block text-[13px] text-[var(--ink-3)]">{role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Landlord CTA ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="rounded-[var(--radius-lg)] border-2 border-[var(--ink)] bg-[var(--brick)] text-[var(--panel)] px-6 sm:px-12 py-12 sm:py-14">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                List your property, reach thousands of renters.
              </h2>
              <p className="mt-3 text-[var(--panel)]/85 leading-relaxed max-w-md">
                Connect with reliable students and professionals looking for housing across
                Nepal. Listing is completely free.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <RegisterButton
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[var(--radius)] bg-[var(--panel)] text-[var(--brick)] font-display font-bold hover:bg-[var(--paper-2)] transition-colors"
                  label="List for free"
                />
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[var(--radius)] border border-[var(--panel)]/50 text-[var(--panel)] font-display font-bold hover:bg-[var(--panel)]/10 transition-colors"
                >
                  Browse listings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
