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
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <h1 className="text-xl font-bold text-center">Create Account</h1>
      <p className="text-sm text-[var(--text-muted)] text-center mt-1">
        Join NayaGhar to find or list a home
      </p>

      {/* Role selector */}
      <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
        <RoleTab
          active={role === "tenant"}
          onClick={() => setRole("tenant")}
          icon={Home}
          label="I'm a Tenant"
          desc="Find a home"
        />
        <RoleTab
          active={role === "landlord"}
          onClick={() => setRole("landlord")}
          icon={Building2}
          label="I'm a Landlord"
          desc="List property"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 p-3 text-sm text-[var(--red)] text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Input name="name" label="Full Name" placeholder="Your name" required />
        <Input name="phone" label="Phone Number" type="tel" placeholder="+977 98XXXXXXXX" required />
        <Input name="email" label="Email (optional)" type="email" placeholder="you@example.com" />
        <Input name="password" label="Password" type="password" placeholder="At least 6 characters" required />
        <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat your password" required />
        <Button size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : `Register as ${role === "tenant" ? "Tenant" : "Landlord"}`}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
        </p>
      </div>
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
      className={`flex flex-col items-start gap-1 p-3 rounded-lg transition-all ${
        active
          ? "bg-[var(--bg-card)] border border-[var(--accent)] shadow-sm"
          : "border border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${active ? "text-[var(--accent)]" : ""}`} />
        <span className={`text-sm font-semibold ${active ? "text-[var(--text)]" : ""}`}>
          {label}
        </span>
      </div>
      <span className="text-[11px] text-[var(--text-muted)]">{desc}</span>
    </button>
  );
}
