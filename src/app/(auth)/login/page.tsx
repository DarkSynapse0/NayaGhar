"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { phone, password, redirect: false });

    if (result?.error) {
      setError("Invalid phone number or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--panel)] border border-[var(--ink)] p-6 sm:p-7">
      <p className="label text-[var(--brick)]">Welcome back</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">Landlord sign in</h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">Sign in to manage your listings.</p>

      {error && (
        <div className="mt-5 rounded-[var(--radius)] bg-[var(--danger-wash)] border border-[var(--danger)]/30 p-3 text-sm text-[var(--danger)] text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Phone number" type="tel" placeholder="+977 98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Input label="Password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-2)]">
        Want to list your property?{" "}
        <Link href="/register" className="font-semibold text-[var(--brick)] hover:underline">Register as a landlord</Link>
      </p>
    </div>
  );
}
