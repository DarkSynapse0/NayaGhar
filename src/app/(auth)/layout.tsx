import Link from "next/link";
import { LogoIcon } from "@/components/ui/Logo";
import { CloudsBackdrop } from "@/components/ui/Illustration";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--paper)]">
      {/* Soft sky + clouds backdrop */}
      <CloudsBackdrop className="absolute inset-0 h-full w-full" />

      {/* Brand, top-left */}
      <Link
        href="/"
        className="absolute top-5 left-5 sm:top-6 sm:left-8 z-20 flex items-center gap-2"
      >
        <LogoIcon size={44} />
        <span className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)]">
          Naya<span className="text-[var(--brick)]">Ghar</span>
        </span>
      </Link>

      {/* Centered card column */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-md animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
