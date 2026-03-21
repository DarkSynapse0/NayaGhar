"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowUpRight } from "lucide-react";

export function ListPropertyButton({ className = "" }: { className?: string }) {
  const { data: session } = useSession();
  const role = session?.user ? (session.user as { role?: string }).role : null;
  const href = role === "landlord" ? "/listing/new" : "/register";

  return (
    <Link href={href} className={className}>
      List Your Property
      <ArrowUpRight className="w-4 h-4" />
    </Link>
  );
}

export function RegisterButton({ className = "", label = "Register Now" }: { className?: string; label?: string }) {
  const { data: session } = useSession();
  const role = session?.user ? (session.user as { role?: string }).role : null;
  const href = role === "landlord" ? "/listing/new" : "/register";

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
