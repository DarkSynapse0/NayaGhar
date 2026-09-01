import Link from "next/link";
import { Building2, Shield, BadgeCheck, MapPin } from "lucide-react";
import { LogoIcon } from "@/components/ui/Logo";

const features = [
  { icon: BadgeCheck, text: "Verified tenant inquiries" },
  { icon: Shield, text: "Safe & secure platform" },
  { icon: Building2, text: "Free to list properties" },
  { icon: MapPin, text: "Map-based search across Nepal" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--paper)]">
      {/* Brand panel — brick block */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[var(--brick)] text-[var(--panel)] border-r-2 border-[var(--ink)]">
        <div className="relative flex flex-col justify-center p-14 w-full">
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <LogoIcon size={40} />
            <span className="font-display text-2xl font-black text-[var(--panel)]">
              NayaGhar
            </span>
          </Link>

          <h2 className="font-display text-3xl font-black tracking-tight leading-tight">
            List your property,
            <br />
            find reliable tenants.
          </h2>
          <p className="mt-4 text-[var(--panel)]/85 max-w-sm leading-relaxed">
            Connect with students and professionals looking for safe housing
            across Nepal.
          </p>

          <div className="mt-12 flex flex-col gap-3 w-full max-w-xs">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-[var(--panel)]/90">
                <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--panel)]/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[var(--panel)]" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
          <LogoIcon size={32} />
          <span className="font-display text-xl font-extrabold text-[var(--ink)]">
            Naya<span className="text-[var(--brick)]">Ghar</span>
          </span>
        </Link>
        <div className="w-full max-w-sm animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
