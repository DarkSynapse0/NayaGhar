"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
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
      role: "landlord",
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

      const result = await signIn("credentials", { phone: body.phone, password: body.password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
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
      <h1 className="text-xl font-bold text-center">Landlord Registration</h1>
      <p className="text-sm text-[var(--text-muted)] text-center mt-1">Create an account to list your properties</p>

      {error && (
        <div className="mt-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 p-3 text-sm text-[var(--red)] text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input name="name" label="Full Name" placeholder="Your name" required />
        <Input name="phone" label="Phone Number" type="tel" placeholder="+977 98XXXXXXXX" required />
        <Input name="email" label="Email (optional)" type="email" placeholder="you@example.com" />
        <Input name="password" label="Password" type="password" placeholder="At least 6 characters" required />
        <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat your password" required />
        <Button size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Register as Landlord"}
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
