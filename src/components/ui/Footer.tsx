import Link from "next/link";
import { getNepaliYear } from "@/lib/nepali-date";
import { LogoIcon } from "./Logo";
import { MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Main grid */}
        <div className="py-14 grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={90} />
              <span className="text-lg font-bold tracking-tight">
                Naya<span className="text-[var(--accent)]">Ghar</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/25 leading-relaxed max-w-[220px]">
              Safe, affordable, and verified housing for students and young
              professionals in Nepal.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[13px] text-white/20">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                Kathmandu, Nepal
              </div>
              <div className="flex items-center gap-2 text-[13px] text-white/20">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                hello@urbannest.np
              </div>
            </div>
          </div>

          {/* For Tenants */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">
              For Tenants
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/search", label: "Search Properties" },
                { href: "/community", label: "Community" },
                { href: "/community", label: "Neighborhood Guides" },
                { href: "/community", label: "Safety Tips" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-white/25 hover:text-white/60 transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Landlords */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">
              For Landlords
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/register", label: "Register" },
                { href: "/listing/new", label: "List Property" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/login", label: "Sign In" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-white/25 hover:text-white/60 transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">
              Cities
            </h4>
            <ul className="space-y-3">
              {[
                "Kathmandu",
                "Lalitpur",
                "Pokhara",
                "Biratnagar",
                "Bharatpur",
                "Bhaktapur",
              ].map((city) => (
                <li key={city}>
                  <Link
                    href={`/search?city=${city}`}
                    className="text-[13px] text-white/25 hover:text-white/60 transition-colors duration-200"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/15">
            &copy; {getNepaliYear()} BS NayaGhar. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-white/15">Privacy Policy</span>
            <span className="text-[12px] text-white/15">Terms of Service</span>
            <span className="text-[12px] text-white/15">
              Made with care in Nepal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
