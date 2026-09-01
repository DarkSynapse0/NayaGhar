import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listings } from "@/lib/db/schema";
import { withRls } from "@/lib/db/rls";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListingToggle } from "@/components/listing/ListingToggle";
import { FadeIn, AnimatedSection } from "@/components/ui/AnimatedSection";
import { EscrowSummaryCard } from "@/components/dashboard/EscrowSummaryCard";
import { EscrowsList } from "@/components/dashboard/EscrowsList";
import { PaymentsList } from "@/components/dashboard/PaymentsList";
import { formatPrice } from "@/lib/constants";
import {
  Building2, Search, Plus, Users, Clock, ArrowUpRight,
  MapPin, TrendingUp, Eye, BarChart3, CircleDot, Lock, Receipt,
} from "lucide-react";

export const metadata = { title: "Dashboard - NayaGhar" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id, name: userName, role } = session.user;
  const name = userName || "Landlord";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch landlord's listings
  let myListings: (typeof listings.$inferSelect)[] = [];
  if (role === "landlord") {
    try {
      myListings = await withRls(id, async (tx) =>
        tx
          .select()
          .from(listings)
          .where(eq(listings.landlordId, id))
          .orderBy(listings.createdAt)
          .limit(50)
      );
    } catch (error) {
      console.error("Failed to fetch landlord listings:", error);
    }
  }

  const activeCount = myListings.filter((l) => l.isActive).length;
  const inactiveCount = myListings.filter((l) => !l.isActive).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative border-b border-[var(--border)] bg-[var(--bg-card)]/50">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[var(--accent)]/3 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <FadeIn>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="highlight" className="text-xs">
                  <CircleDot className="w-3 h-3" />
                  {role === "landlord" ? "Landlord" : role === "admin" ? "Admin" : "Tenant"}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {greeting}, {name}
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {role === "landlord"
                  ? `Managing ${myListings.length} ${myListings.length === 1 ? "property" : "properties"}`
                  : "Track your escrows and payments"}
              </p>
            </FadeIn>
            {role === "landlord" && (
              <FadeIn delay={0.1}>
                <Link href="/listing/new">
                  <Button size="lg">
                    <Plus className="w-4 h-4" /> New Listing
                  </Button>
                </Link>
              </FadeIn>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8">
        {/* Escrow snapshot row */}
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FadeIn>
            <EscrowSummaryCard
              userId={id}
              viewerRole={role === "landlord" ? "landlord" : "tenant"}
            />
          </FadeIn>
          <FadeIn delay={0.05} className="lg:col-span-2">
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 h-full">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-sm font-bold">Recent escrows</h2>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {role === "tenant" ? "as tenant" : "as landlord"}
                </span>
              </div>
              <EscrowsList userId={id} viewerRole={role === "landlord" ? "landlord" : "tenant"} />
            </div>
          </FadeIn>
        </section>

        {/* Payment history */}
        <section className="mb-10">
          <FadeIn>
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold">Payment history</h2>
              <span className="ml-2 text-xs text-[var(--text-muted)]">
                Esewa &amp; Khalti — both directions
              </span>
            </div>
          </FadeIn>
          <FadeIn delay={0.05}>
            <PaymentsList userId={id} />
          </FadeIn>
        </section>

        {/* Stats */}
        {role === "landlord" && (
          <AnimatedSection className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10" stagger={0.06}>
            {[
              { label: "Total Listings", value: String(myListings.length), icon: BarChart3, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/8" },
              { label: "Active", value: String(activeCount), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/8" },
              { label: "Rented Out", value: String(inactiveCount), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/8" },
              { label: "Occupancy", value: myListings.length > 0 ? `${Math.round((inactiveCount / myListings.length) * 100)}%` : "0%", icon: Eye, color: "text-violet-400", bg: "bg-violet-500/8" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4 sm:p-5 hover:border-[var(--border-hover)] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold price-display">{value}</p>
              </div>
            ))}
          </AnimatedSection>
        )}

        {/* Listings Table */}
        {role === "landlord" && (
          <section className="mb-10">
            <FadeIn>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Your Properties</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Manage your listings and track availability
                  </p>
                </div>
                {myListings.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span className="hidden sm:flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Available
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> Rented
                    </span>
                  </div>
                )}
              </div>
            </FadeIn>

            {myListings.length === 0 ? (
              <FadeIn delay={0.1}>
                <div className="rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border-hover)] p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/8 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-7 h-7 text-[var(--accent)] opacity-60" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">No properties listed yet</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-5 max-w-xs mx-auto">
                    Start by creating your first listing. It only takes a few minutes.
                  </p>
                  <Link href="/listing/new">
                    <Button>
                      <Plus className="w-4 h-4" /> Create Your First Listing
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ) : (
              <FadeIn delay={0.1}>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  {/* Table header - desktop only */}
                  <div className="hidden sm:grid sm:grid-cols-[auto_1fr_120px_140px_100px] gap-4 items-center px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <span className="w-16">Photo</span>
                    <span>Property</span>
                    <span>Price</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {/* Listing rows */}
                  <div className="divide-y divide-[var(--border)]">
                    {myListings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`group bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)]/50 transition-colors ${
                          !listing.isActive ? "opacity-60 hover:opacity-80" : ""
                        }`}
                      >
                        <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_120px_140px_100px] gap-3 sm:gap-4 items-start sm:items-center p-4 sm:px-5 sm:py-4">
                          {/* Thumbnail */}
                          <div className="w-full sm:w-16 h-20 sm:h-12 rounded-lg overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0">
                            {listing.photos?.[0] ? (
                              <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
                                No photo
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                              {listing.title}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-[var(--text-muted)]">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city}
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="sm:text-right">
                            <p className="text-sm font-bold text-[var(--text)] price-display">
                              {formatPrice(listing.priceMonthly)}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)]">per month</p>
                          </div>

                          {/* Status */}
                          <div>
                            <ListingToggle listingId={listing.id} initialActive={listing.isActive ?? true} />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 sm:justify-end w-full sm:w-auto">
                            <Link
                              href={`/listing/${listing.id}`}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-all"
                            >
                              View <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <FadeIn>
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          </FadeIn>
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-3 gap-3" stagger={0.06}>
            {[
              { href: "/search", icon: Search, title: "Search Properties", desc: "Find homes with smart search", color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/8" },
              { href: "/listing/new", icon: Plus, title: "List a Property", desc: "Add a new listing", color: "text-emerald-400", bg: "bg-emerald-500/8" },
              { href: "/community", icon: Users, title: "Community", desc: "Neighborhood guides & tips", color: "text-violet-400", bg: "bg-violet-500/8" },
            ].map(({ href, icon: Icon, title, desc, color, bg }) => (
              <Link key={title} href={href}>
                <div className="group rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{title}</h3>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </AnimatedSection>
        </section>
      </div>
    </div>
  );
}
