import {
  Wifi, Snowflake, WashingMachine, UtensilsCrossed, SquareParking, Zap, Droplets, Sofa, Shield, Cctv,
  DoorOpen, Building2, Users, BedDouble,
} from "lucide-react";

/**
 * Format paisa (smallest currency unit) to a numeric display string.
 * 1 NPR = 100 paisa. Returns just the number, e.g. "8,000".
 */
export function formatPriceValue(paisa: number): string {
  return (paisa / 100).toLocaleString();
}

/**
 * Format paisa to full display string with currency prefix.
 * Returns e.g. "Rs. 8,000".
 */
export function formatPrice(paisa: number): string {
  return `Rs. ${formatPriceValue(paisa)}`;
}

/** Amenity name → Lucide icon mapping, used across listing cards, detail pages, and forms. */
export const AMENITY_ICONS: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  AC: Snowflake,
  Laundry: WashingMachine,
  Kitchen: UtensilsCrossed,
  Parking: SquareParking,
  "Power Backup": Zap,
  "Water Supply": Droplets,
  Furnished: Sofa,
  Security: Shield,
  CCTV: Cctv,
};

/** Amenity options for listing creation form (all available amenities). */
export const AMENITY_OPTIONS = Object.entries(AMENITY_ICONS).map(([name, icon]) => ({
  name,
  icon,
}));

/** Property type definitions used in search filters, listing forms, and display. */
export const PROPERTY_TYPES = [
  { value: "room" as const, label: "Room", icon: DoorOpen, desc: "Single or shared room" },
  { value: "apartment" as const, label: "Apartment", icon: Building2, desc: "Full apartment or flat" },
  { value: "pg" as const, label: "PG", icon: Users, desc: "Paying guest accommodation" },
  { value: "hostel" as const, label: "Hostel", icon: BedDouble, desc: "Hostel bed or dorm" },
];

/** Short labels for property types (used on listing cards). */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  room: "Room",
  apartment: "Apt",
  pg: "PG",
  hostel: "Hostel",
};

/** Cities supported by the platform. */
export const CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Pokhara",
  "Biratnagar",
  "Bharatpur",
  "Bhaktapur",
] as const;

/** Top cities shown on the home page map overlay. */
export const FEATURED_CITIES = ["Kathmandu", "Pokhara", "Lalitpur"] as const;

/**
 * Hackathon cap on escrowable deposits. Two reasons:
 *   1. Esewa / Khalti standard accounts are limited to ~Rs 100k/transaction;
 *      keeping deposits well under that avoids provider rejections.
 *   2. SOL price volatility on the held escrow is a platform risk — capping
 *      the per-escrow exposure caps that risk too.
 *
 * Production path: switch the escrow program to hold USDC instead of SOL.
 */
export const MAX_ESCROW_DEPOSIT_PAISA = 5_000_000; // Rs 50,000
export const MAX_ESCROW_DEPOSIT_NPR = MAX_ESCROW_DEPOSIT_PAISA / 100;
