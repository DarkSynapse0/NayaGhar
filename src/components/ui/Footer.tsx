import Link from "next/link";
import { getNepaliYear } from "@/lib/nepali-date";
import { CITIES } from "@/lib/constants";
import { LogoIcon } from "./Logo";
import { MapPin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--paper-2)]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Main grid */}
        <div className="py-14 grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={56} />
              <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                Naya<span className="text-[var(--brick)]">Ghar</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-[var(--ink-2)] leading-relaxed max-w-[220px]">
              Safe, affordable, verified housing for students and young
              professionals across Nepal.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--geo)]" />
                Kathmandu, Nepal
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                hello@nayaghar.np
              </div>
            </div>
          </div>

          {/* For Tenants */}
          <div>
            <h4 className="label text-[var(--ink-3)] mb-4">For Tenants</h4>
            <ul className="space-y-3">
              {[
                { href: "/search", label: "Search rooms" },
                { href: "/community", label: "Community" },
                { href: "/community", label: "Neighborhood guides" },
                { href: "/community", label: "Safety tips" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[var(--ink-2)] hover:text-[var(--brick)] transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Landlords */}
          <div>
            <h4 className="label text-[var(--ink-3)] mb-4">For Landlords</h4>
            <ul className="space-y-3">
              {[
                { href: "/register", label: "Register" },
                { href: "/listing/new", label: "List a property" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/login", label: "Sign in" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-[var(--ink-2)] hover:text-[var(--brick)] transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="label text-[var(--ink-3)] mb-4">Cities</h4>
            <ul className="space-y-3">
              {CITIES.map((city) => (
                <li key={city}>
                  <Link
                    href={`/search?city=${city}`}
                    className="text-[13px] text-[var(--ink-2)] hover:text-[var(--brick)] transition-colors duration-150"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[var(--ink-3)]">
            &copy; {getNepaliYear()} BS · NayaGhar. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-[var(--ink-3)]">Privacy</span>
            <span className="text-[12px] text-[var(--ink-3)]">Terms</span>
            <span className="text-[12px] text-[var(--ink-3)]">Made in Nepal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
