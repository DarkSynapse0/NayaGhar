import Link from "next/link";
import { FadeIn, AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import {
  MapPin, Eye, FileText, Users, BadgeCheck, MessageCircle,
  GraduationCap, Wallet, Train, Moon, Briefcase, Building2,
  ArrowUpRight, Search,
} from "lucide-react";

export const metadata = { title: "Community - NayaGhar" };

const tagIcons: Record<string, typeof GraduationCap> = {
  Students: GraduationCap,
  Budget: Wallet,
  Transit: Train,
  Nightlife: Moon,
  Professionals: Briefcase,
  "IT Hub": Building2,
  Modern: Building2,
  Mixed: Users,
};

const neighborhoods = [
  {
    name: "Thamel",
    city: "Kathmandu",
    desc: "Central hub with budget rooms, PGs, and hostels. Great nightlife and food scene.",
    tags: ["Students", "Nightlife"],
    color: "bg-[var(--accent)]",
  },
  {
    name: "Balkumari",
    city: "Lalitpur",
    desc: "Near KU and IT parks. Growing area with modern apartments and co-living.",
    tags: ["IT Hub", "Students"],
    color: "bg-violet-500",
  },
  {
    name: "Lakeside",
    city: "Pokhara",
    desc: "Scenic lakeside area. Affordable rooms with mountain views.",
    tags: ["Budget", "Mixed"],
    color: "bg-emerald-500",
  },
  {
    name: "Naxal",
    city: "Kathmandu",
    desc: "Well-connected central area near embassies, offices, and hospitals.",
    tags: ["Professionals", "Transit"],
    color: "bg-rose-500",
  },
];

const tips = [
  { icon: Eye, title: "Visit in person", text: "Always visit the property in person before paying any deposit." },
  { icon: FileText, title: "Get an agreement", text: "Check for a proper rent agreement — insist on one if the landlord doesn't offer it." },
  { icon: Users, title: "Talk to neighbors", text: "Ask neighbors about water supply, load shedding schedule, and safety." },
  { icon: BadgeCheck, title: "Use verified listings", text: "Use NayaGhar's verified badge to filter trustworthy listings." },
  { icon: MessageCircle, title: "Read reviews", text: "Connect with other tenants in the area via community reviews." },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative border-b border-[var(--border)] bg-[var(--bg-card)]/30">
        <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8 pt-8 pb-8">
          <FadeIn>
            <p className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-2">
              Community
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Neighborhood guides
              <br />
              <span className="text-[var(--text-muted)]">& city tips.</span>
            </h1>
            <p className="mt-3 text-sm text-[var(--text-muted)] max-w-md">
              Explore popular neighborhoods, read tips from fellow migrants, and find the right area for you.
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="px-5 sm:px-8 py-10">
        <div className="mx-auto max-w-4xl">
          {/* Neighborhoods */}
          <FadeIn>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase">
                Popular Areas
              </h2>
              <Link
                href="/search"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </FadeIn>

          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14" stagger={0.08}>
            {neighborhoods.map((area) => (
              <Link
                key={area.name}
                href={`/search?city=${area.city}`}
                className="group block"
              >
                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden hover:border-[var(--border-hover)] transition-all duration-200 hover:-translate-y-0.5">
                  <div className={`h-1 ${area.color}`} />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                        <h3 className="font-bold">{area.name}, {area.city}</h3>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                      {area.desc}
                    </p>
                    <div className="flex gap-2">
                      {area.tags.map((tag) => {
                        const Icon = tagIcons[tag];
                        return (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-secondary)]"
                          >
                            {Icon && <Icon className="w-3 h-3" />}
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </AnimatedSection>

          {/* Tips */}
          <FadeIn>
            <h2 className="text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-2">
              Advice
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">
              Tips for newcomers
              <br />
              <span className="text-[var(--text-muted)]">to the city.</span>
            </h3>
          </FadeIn>

          <AnimatedSection className="space-y-3 mb-14" stagger={0.08}>
            {tips.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group flex gap-4 items-start rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/15 transition-colors">
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5">{title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </AnimatedSection>

          {/* CTA */}
          <FadeIn>
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-8 sm:p-10 text-center">
              <Search className="w-8 h-8 text-[var(--accent)] mx-auto mb-3 opacity-60" />
              <h3 className="text-xl font-bold mb-2">Ready to find your place?</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mb-5">
                Search verified listings near your college, workplace, or favorite neighborhood.
              </p>
              <Link href="/search">
                <Button size="lg">
                  <Search className="w-4 h-4" /> Search Properties
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
