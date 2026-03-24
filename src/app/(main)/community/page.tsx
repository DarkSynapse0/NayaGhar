import { FadeIn, AnimatedSection } from "@/components/ui/AnimatedSection";
import { MapPin, Eye, FileText, Users, BadgeCheck, MessageCircle, GraduationCap, Wallet, Train, Moon, Briefcase, Building2, ArrowUpRight } from "lucide-react";

export const metadata = { title: "Community - NayaGhar" };

const tagIcons: Record<string, typeof GraduationCap> = { Students: GraduationCap, Budget: Wallet, Transit: Train, Nightlife: Moon, Professionals: Briefcase, "IT Hub": Building2, Modern: Building2, Mixed: Users };

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative pt-8 pb-10 px-5 sm:px-8">
        <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-2">Community</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Neighborhood guides<br /><span className="text-[var(--text-muted)]">& city tips.</span>
            </h1>
          </FadeIn>
        </div>
      </div>

      <div className="px-5 sm:px-8 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Neighborhoods */}
          <FadeIn>
            <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-4">Popular Areas</p>
          </FadeIn>
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16" stagger={0.08}>
            {[
              { name: "Thamel, Kathmandu", desc: "Central hub with budget rooms, PGs, and hostels. Great nightlife and food scene.", tags: ["Students", "Nightlife"], color: "bg-[var(--accent)]", glow: "bg-[var(--accent)]/5" },
              { name: "Balkumari, Lalitpur", desc: "Near KU and IT parks. Growing area with modern apartments and co-living.", tags: ["IT Hub", "Students"], color: "bg-violet-500", glow: "bg-violet-500/5" },
              { name: "Lakeside, Pokhara", desc: "Scenic lakeside area. Affordable rooms with mountain views.", tags: ["Budget", "Mixed"], color: "bg-emerald-500", glow: "bg-emerald-500/5" },
              { name: "Naxal, Kathmandu", desc: "Well-connected central area near embassies, offices, and hospitals.", tags: ["Professionals", "Transit"], color: "bg-rose-500", glow: "bg-rose-500/5" },
            ].map((area) => (
              <div key={area.name} className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden hover:border-[var(--border-hover)] transition-all duration-300 relative">
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${area.glow} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`h-1 ${area.color}`} />
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                      <h3 className="font-bold text-lg">{area.name}</h3>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{area.desc}</p>
                  <div className="flex gap-2 mt-4">
                    {area.tags.map((tag) => {
                      const Icon = tagIcons[tag];
                      return (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-secondary)]">
                          {Icon && <Icon className="w-3 h-3" />}{tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </AnimatedSection>

          {/* Tips */}
          <FadeIn>
            <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-2">Advice</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">
              Tips for newcomers<br /><span className="text-[var(--text-muted)]">to the city.</span>
            </h2>
          </FadeIn>
          <AnimatedSection className="space-y-3" stagger={0.08}>
            {[
              { icon: Eye, text: "Always visit the property in person before paying any deposit." },
              { icon: FileText, text: "Check for a proper rent agreement — insist on one if the landlord doesn't offer it." },
              { icon: Users, text: "Ask neighbors about water supply, load shedding schedule, and safety." },
              { icon: BadgeCheck, text: "Use NayaGhar's verified badge to filter trustworthy listings." },
              { icon: MessageCircle, text: "Connect with other tenants in the area via community reviews." },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="group flex gap-4 items-start rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--border-hover)] transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/15 transition-colors">
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-2">{text}</p>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
