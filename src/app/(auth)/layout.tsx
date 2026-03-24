import Link from "next/link";
import { Building2, Shield, BadgeCheck } from "lucide-react";
import { LogoIcon } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-emerald-500/3" />
        <div className="absolute inset-0 dot-grid" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[100px]" />
        <div className="relative flex flex-col items-center justify-center p-12 text-center">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <LogoIcon size={48} />
            <span className="text-2xl font-extrabold">Naya<span className="text-[var(--accent)]">Ghar</span></span>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight">
            List your property,<br /><span className="text-[var(--text-muted)]">find reliable tenants.</span>
          </h2>
          <p className="mt-4 text-[var(--text-secondary)] max-w-sm leading-relaxed">
            Connect with students and professionals looking for safe housing across Nepal.
          </p>
          <div className="mt-12 flex flex-col gap-4">
            {[
              { icon: BadgeCheck, text: "Verified tenant inquiries" },
              { icon: Shield, text: "Safe & secure platform" },
              { icon: Building2, text: "Free to list properties" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center"><Icon className="w-4 h-4 text-[var(--accent)]" /></div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
          <LogoIcon size={36} />
          <span className="text-xl font-extrabold">Naya<span className="text-[var(--accent)]">Ghar</span></span>
        </Link>
        <div className="w-full max-w-sm animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
