import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/Button";
import { ListingToggle } from "@/components/listing/ListingToggle";
import { FadeIn, AnimatedSection } from "@/components/ui/AnimatedSection";
import { Building2, MessageSquare, Star, Search, Plus, Users, Clock, ArrowUpRight, MapPin } from "lucide-react";

export const metadata = { title: "Dashboard - NayaGhar" };

function formatPrice(paisa: number): string { return `Rs. ${(paisa / 100).toLocaleString()}`; }

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id: string; name?: string | null; role: string };
  const name = user.name || "Landlord";
  const role = user.role;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Fetch landlord's listings
  let myListings: (typeof listings.$inferSelect)[] = [];
  if (role === "landlord") {
    try {
      myListings = await getDb()
        .select()
        .from(listings)
        .where(eq(listings.landlordId, user.id))
        .orderBy(listings.createdAt)
        .limit(50);
    } catch {}
  }

  const activeCount = myListings.filter((l) => l.isActive).length;
  const inactiveCount = myListings.filter((l) => !l.isActive).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative pt-8 pb-10 px-5 sm:px-8">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative mx-auto max-w-5xl flex items-center justify-between">
          <FadeIn>
            <div>
              <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-2">Dashboard</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {greeting},<br /><span className="text-[var(--text-secondary)]">{name}</span>
              </h1>
            </div>
          </FadeIn>
          {role === "landlord" && (
            <FadeIn delay={0.1}>
              <Link href="/listing/new"><Button size="lg"><Plus className="w-4 h-4" /> New Listing</Button></Link>
            </FadeIn>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-8 pb-16">
        <div className="mx-auto max-w-5xl">
          {/* Stats */}
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12" stagger={0.08}>
            {[
              { label: "Active Listings", value: String(activeCount), icon: Building2, glow: "bg-emerald-500/8", iconColor: "text-emerald-400" },
              { label: "Rented Out", value: String(inactiveCount), icon: Clock, glow: "bg-amber-500/8", iconColor: "text-amber-400" },
              { label: "Total Listings", value: String(myListings.length), icon: Star, glow: "bg-[var(--accent)]/8", iconColor: "text-[var(--accent)]" },
            ].map(({ label, value, icon: Icon, glow, iconColor }) => (
              <div key={label} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 relative overflow-hidden group hover:border-[var(--border-hover)] transition-colors">
                <div className={`absolute -top-10 -right-10 w-32 h-32 ${glow} rounded-full blur-[40px] group-hover:blur-[50px] transition-all`} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">{label}</p>
                    <p className="text-4xl font-extrabold mt-2" style={{ fontFamily: "var(--font-mono)" }}>{value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${glow} flex items-center justify-center`}><Icon className={`w-6 h-6 ${iconColor}`} /></div>
                </div>
              </div>
            ))}
          </AnimatedSection>

          {/* My Listings */}
          {role === "landlord" && (
            <>
              <FadeIn>
                <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-4">Your Listings</p>
              </FadeIn>

              {myListings.length === 0 ? (
                <FadeIn delay={0.1}>
                  <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center">
                    <Building2 className="w-10 h-10 mx-auto text-white/10 mb-3" />
                    <p className="text-white/50 mb-4">You haven&apos;t listed any properties yet</p>
                    <Link href="/listing/new"><Button><Plus className="w-4 h-4" /> Create Your First Listing</Button></Link>
                  </div>
                </FadeIn>
              ) : (
                <AnimatedSection className="space-y-3" stagger={0.06}>
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className={`rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4 sm:p-5 hover:border-[var(--border-hover)] transition-all duration-200 ${
                        !listing.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-full sm:w-28 h-20 sm:h-20 rounded-xl overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0">
                          {listing.photos?.[0] ? (
                            <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">No photo</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${listing.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                            <h3 className="font-semibold text-[15px] text-white truncate">{listing.title}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-[12px] text-white/25">
                            <MapPin className="w-3 h-3" />
                            {listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>
                              Rs. {(listing.priceMonthly / 100).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-white/20">/month</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ListingToggle listingId={listing.id} initialActive={listing.isActive ?? true} />
                          <Link
                            href={`/listing/${listing.id}`}
                            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border)] hover:bg-white/[0.04] transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4 text-white/40" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </AnimatedSection>
              )}

              {/* Spacer before quick actions */}
              <div className="mt-12" />
            </>
          )}

          {/* Quick Actions */}
          <FadeIn>
            <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-4">Quick Actions</p>
          </FadeIn>
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 gap-4" stagger={0.08}>
            {[
              { href: "/search", icon: Search, title: "Search Properties", desc: "Find homes with smart search", color: "text-[var(--accent)]", glow: "bg-[var(--accent)]/5" },
              { href: "/listing/new", icon: Plus, title: "List a Property", desc: "Add a new listing", color: "text-emerald-400", glow: "bg-emerald-500/5" },
              { href: "/community", icon: Users, title: "Community", desc: "Reviews and neighborhood guides", color: "text-violet-400", glow: "bg-violet-500/5" },
              { href: "#", icon: MessageSquare, title: "Conversations", desc: "WhatsApp — coming soon", color: "text-[var(--text-muted)]", glow: "", disabled: true },
            ].map(({ href, icon: Icon, title, desc, color, glow, disabled }) => (
              <Link key={title} href={href} className={disabled ? "pointer-events-none" : ""}>
                <div className={`group rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 relative overflow-hidden hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-300 ${disabled ? "opacity-30" : ""}`}>
                  {glow && <div className={`absolute -bottom-10 -left-10 w-32 h-32 ${glow} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />}
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Icon className={`w-6 h-6 ${color} mt-0.5`} />
                      <div><h3 className="font-bold">{title}</h3><p className="text-sm text-[var(--text-muted)] mt-0.5">{desc}</p></div>
                    </div>
                    {!disabled && <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white transition-colors" />}
                  </div>
                </div>
              </Link>
            ))}
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
