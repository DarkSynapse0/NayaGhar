"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { BadgeCheck, MapPin, ArrowUpRight, Wifi, Snowflake, Car, Shield, Zap, WashingMachine, Sofa } from "lucide-react";
import type { Listing } from "@/types/listing";

function formatPrice(paisa: number): string {
  return (paisa / 100).toLocaleString();
}

const typeLabels: Record<string, string> = { room: "Room", apartment: "Apt", pg: "PG", hostel: "Hostel" };
const amenityIcons: Record<string, typeof Wifi> = { WiFi: Wifi, AC: Snowflake, Parking: Car, Security: Shield, "Power Backup": Zap, Laundry: WashingMachine, Furnished: Sofa };

export function ListingCard({ listing }: { listing: Listing }) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const enter = () => gsap.to(el, { y: -6, duration: 0.35, ease: "power3.out" });
    const leave = () => gsap.to(el, { y: 0, duration: 0.35, ease: "power3.out" });
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
  }, []);

  const photo = listing.photos?.[0];
  const amenities = listing.amenities ? Object.entries(listing.amenities).filter(([, v]) => v).slice(0, 3) : [];

  return (
    <Link ref={cardRef} href={`/listing/${listing.id}`} className="block will-change-transform">
      <div className="relative rounded-[20px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] hover:border-white/[0.1] transition-[border-color] duration-500 group">

        {/* Image area */}
        <div className="relative h-56 sm:h-60 overflow-hidden">
          {photo ? (
            <img
              src={photo.url}
              alt={photo.alt || listing.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center">
              <span className="text-[var(--text-muted)] text-xs uppercase tracking-widest">No Image</span>
            </div>
          )}

          {/* Permanent dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Top row — type pill */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[11px] font-semibold text-white/80 uppercase tracking-wide">
              {typeLabels[listing.propertyType]}
            </span>
            {listing.isVerified && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md text-[11px] font-semibold text-emerald-400">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          {/* Deposit overlay — bottom left on image */}
          {listing.deposit && (
            <div className="absolute bottom-4 left-4">
              <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[11px] font-medium text-white/60">
                Deposit Rs. {formatPrice(listing.deposit)}
              </span>
            </div>
          )}

          {/* Arrow — bottom right */}
          <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="w-4 h-4 text-[var(--text)]" />
          </div>
        </div>

        {/* Info */}
        <div className="px-5 pb-5 pt-3 space-y-3">
          <div>
            <h3 className="font-bold text-[15px] text-[var(--text)] leading-snug line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-300">
              {listing.title}
            </h3>
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[12px] text-[var(--text-muted)] truncate">
                {listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city}
              </span>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="flex items-center gap-1">
              {amenities.map(([key]) => {
                const Icon = amenityIcons[key];
                return Icon ? (
                  <div key={key} className="w-6 h-6 rounded-md bg-[var(--bg-hover)] flex items-center justify-center" title={key}>
                    <Icon className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                ) : null;
              })}
              {listing.amenities && Object.values(listing.amenities).filter(Boolean).length > 3 && (
                <span className="text-[10px] text-[var(--text-muted)] ml-1">
                  +{Object.values(listing.amenities).filter(Boolean).length - 3}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="pt-2 border-t border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] font-medium mr-0.5">Rs.</span>
            <span className="text-lg font-extrabold text-[var(--accent)]">
              {formatPrice(listing.priceMonthly)}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium ml-0.5">/mo</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
