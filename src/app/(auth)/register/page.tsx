"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Home, Building2 } from "lucide-react";

type Role = "tenant" | "landlord";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("tenant");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;

    if (password !== form.get("confirmPassword")) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setSubmitting(false);
      return;
    }

    const body = {
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email") || undefined,
      password,
      role,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Registration failed");
        setSubmitting(false);
        return;
      }

      const result = await signIn("credentials", {
        phone: body.phone,
        password: body.password,
        redirect: false,
      });
      if (result?.error) {
        router.push("/login");
        return;
      }

      // Tenants want to browse listings; landlords want to manage their dashboard.
      router.push(role === "tenant" ? "/search" : "/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Registration failed:", error);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--ink)] p-6 sm:p-7">
      <p className="label text-[var(--brick)]">Get started</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">Create your account</h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">Join NayaGhar to find or list a home.</p>

      {/* Role selector */}
      <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-[var(--radius)] bg-[var(--paper-2)] border border-[var(--line)]">
        <RoleTab
          active={role === "tenant"}
          onClick={() => setRole("tenant")}
          icon={Home}
          label="I'm a tenant"
          desc="Find a home"
        />
        <RoleTab
          active={role === "landlord"}
          onClick={() => setRole("landlord")}
          icon={Building2}
          label="I'm a landlord"
          desc="List property"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-[var(--radius)] bg-[var(--danger-wash)] border border-[var(--danger)]/30 p-3 text-sm text-[var(--danger)] text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Input name="name" label="Full name" placeholder="Your name" required />
        <Input name="phone" label="Phone number" type="tel" placeholder="+977 98XXXXXXXX" required />
        <Input name="email" label="Email (optional)" type="email" placeholder="you@example.com" />
        <Input name="password" label="Password" type="password" placeholder="At least 6 characters" required />
        <Input name="confirmPassword" label="Confirm password" type="password" placeholder="Repeat your password" required />
        <Button size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : `Register as ${role === "tenant" ? "tenant" : "landlord"}`}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-2)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--brick)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

function RoleTab({
  active,
  onClick,
  icon: Icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Home;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 p-3 rounded-[var(--radius-sm)] transition-colors ${
        active
          ? "bg-[var(--panel)] border border-[var(--ink)]"
          : "border border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${active ? "text-[var(--brick)]" : ""}`} />
        <span className={`text-sm font-semibold ${active ? "text-[var(--ink)]" : ""}`}>
          {label}
        </span>
      </div>
      <span className="text-[11px] text-[var(--ink-3)]">{desc}</span>
    </button>
  );
}
