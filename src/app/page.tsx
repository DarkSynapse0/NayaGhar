import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/search/SearchBar";
import { HomeMapSection } from "@/components/map/HomeMapSection";
import { AnimatedSection, FadeIn } from "@/components/ui/AnimatedSection";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ListPropertyButton, RegisterButton } from "@/components/ui/ListPropertyButton";
import {
  MapPin, MessageCircle, DoorOpen, Building2, Users, BedDouble,
  BadgeCheck, Shield, Smartphone, ArrowRight, ArrowUpRight,
  Search, Star, Zap,
} from "lucide-react";

export default async function HomePage() {
  let allListings: (typeof listings.$inferSelect)[] = [];
  try {
    allListings = await getDb().select().from(listings).where(eq(listings.isActive, true)).limit(50);
  } catch {}

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <Navbar />
      <div className="h-14" />

      {/* Hero */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-5 sm:px-8">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#6366F1]/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl">
          <FadeIn>
            <p className="text-sm text-[#6366F1] font-semibold tracking-wider uppercase mb-6">
              Housing Platform for Nepal
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-extrabold leading-[0.95] tracking-tight">
              Find Your<br />
              <span className="bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#059669] bg-clip-text text-transparent">
                Home
              </span>{" "}
              in the City
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg sm:text-xl text-white/40 max-w-xl leading-relaxed">
              Safe, affordable, and verified housing for students and young professionals moving to cities across Nepal.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/search" className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#6366F1] text-white font-semibold hover:bg-[#4F46E5] transition-all duration-300 active:scale-[0.97]">
                <Search className="w-4 h-4" />
                Search Properties
              </Link>
              <ListPropertyButton className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full border border-white/10 text-white font-semibold hover:bg-white/5 transition-all duration-300" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Map Section */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <FadeIn>
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl overflow-hidden border border-white/10 relative">
              <div className="h-[400px] sm:h-[500px]">
                <HomeMapSection listings={allListings} />
              </div>
              {/* Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {["Kathmandu", "Pokhara", "Lalitpur"].map((city) => (
                      <span key={city} className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium backdrop-blur-sm">
                        {city}
                      </span>
                    ))}
                    <span className="text-white/30 text-sm hidden sm:inline">{allListings.length} listings</span>
                  </div>
                  <Link href="/search" className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#0A0A0A] text-sm font-semibold hover:bg-white/90 transition-colors">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Bento Grid */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-sm text-[#6366F1] font-semibold tracking-wider uppercase mb-4">Features</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-12">
              Everything you need,<br />
              <span className="text-white/30">nothing you don&apos;t.</span>
            </h2>
          </FadeIn>

          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.08}>
            {/* Property types — large */}
            <div className="lg:col-span-2 rounded-2xl bg-[#111111] border border-white/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-[80px] group-hover:bg-[#6366F1]/10 transition-all duration-700" />
              <p className="text-sm text-white/30 font-semibold uppercase tracking-wider mb-6">Browse Properties</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                {[
                  { type: "room", label: "Rooms", icon: DoorOpen, color: "from-amber-500/20 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40" },
                  { type: "apartment", label: "Apartments", icon: Building2, color: "from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40" },
                  { type: "pg", label: "PG", icon: Users, color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40" },
                  { type: "hostel", label: "Hostels", icon: BedDouble, color: "from-violet-500/20 to-violet-500/5 border-violet-500/20 hover:border-violet-500/40" },
                ].map(({ type, label, icon: Icon, color }) => (
                  <Link key={type} href={`/search?type=${type}`} className={`rounded-xl bg-gradient-to-b ${color} border p-5 text-center transition-all duration-300 hover:-translate-y-1`}>
                    <Icon className="w-6 h-6 mx-auto text-white/60 mb-3" />
                    <p className="text-sm font-semibold text-white/80">{label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="rounded-2xl bg-[#111111] border border-white/5 p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#25D366]/10 rounded-full blur-[60px] group-hover:bg-[#25D366]/15 transition-all duration-700" />
              <MessageCircle className="w-8 h-8 text-[#25D366] mb-6" />
              <div>
                <p className="text-lg font-bold text-white mb-2">WhatsApp Connect</p>
                <p className="text-sm text-white/30 leading-relaxed">Message verified landlords directly. No app downloads needed.</p>
              </div>
            </div>

            {/* Trust */}
            <div className="rounded-2xl bg-[#111111] border border-white/5 p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center"><BadgeCheck className="w-5 h-5 text-[#6366F1]" /></div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-500" /></div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Star className="w-5 h-5 text-amber-500" /></div>
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-2">Trust & Safety</p>
                <p className="text-sm text-white/30 leading-relaxed">Verified listings, community reviews, phone-verified landlords.</p>
              </div>
            </div>

            {/* Map search */}
            <div className="rounded-2xl bg-[#111111] border border-white/5 p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-40 h-40 bg-violet-500/5 rounded-full blur-[60px] group-hover:bg-violet-500/10 transition-all duration-700" />
              <MapPin className="w-8 h-8 text-violet-400 mb-6" />
              <div>
                <p className="text-lg font-bold text-white mb-2">Map-First Search</p>
                <p className="text-sm text-white/30 leading-relaxed">See listings near your college, workplace, or transit hubs on an interactive map.</p>
              </div>
            </div>

            {/* Low bandwidth */}
            <div className="rounded-2xl bg-[#111111] border border-white/5 p-8 flex flex-col justify-between">
              <Zap className="w-8 h-8 text-amber-400 mb-6" />
              <div>
                <p className="text-lg font-bold text-white mb-2">Lightning Fast</p>
                <p className="text-sm text-white/30 leading-relaxed">Optimized for 2G connections. Works on any device, anywhere in Nepal.</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <FadeIn>
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/5 bg-[#111111] p-8 sm:p-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
              {[
                { value: `${allListings.length}+`, label: "Active Listings" },
                { value: "5", label: "Cities" },
                { value: "24/7", label: "WhatsApp Support" },
                { value: "Free", label: "For Landlords" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-white price-display">{value}</p>
                  <p className="text-sm text-white/30 mt-2">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <FadeIn>
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/5 bg-gradient-to-br from-[#6366F1]/10 via-[#111111] to-[#059669]/10 p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#6366F1]/5 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <p className="text-sm text-[#6366F1] font-semibold tracking-wider uppercase mb-4">For Landlords</p>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
                List your property,<br />reach thousands.
              </h2>
              <p className="text-white/30 max-w-md mx-auto mb-8">
                Connect with reliable students and professionals looking for housing across Nepal. Completely free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <RegisterButton className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[#6366F1] text-white font-semibold hover:bg-[#4F46E5] transition-all active:scale-[0.97]" label="Register Now" />
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
                {[
                  { icon: BadgeCheck, text: "100% free" },
                  { icon: Shield, text: "Verified tenants" },
                  { icon: Smartphone, text: "WhatsApp integration" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-white/30">
                    <Icon className="w-4 h-4 text-[#6366F1]" />{text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
