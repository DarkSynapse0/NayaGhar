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
    setLoading(true); setError("");
    const result = await signIn("credentials", { phone, password, redirect: false });
    if (result?.error) { setError("Invalid phone number or password"); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }

  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <h1 className="text-xl font-bold text-center">Landlord Sign In</h1>
      <p className="text-sm text-[var(--text-muted)] text-center mt-1">Sign in to manage your listings</p>
      {error && <div className="mt-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 p-3 text-sm text-[var(--red)] text-center animate-shake">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label="Phone Number" type="tel" placeholder="+977 98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Input label="Password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button size="lg" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Want to list your property?{" "}<Link href="/register" className="text-[var(--accent)] hover:underline">Register as a landlord</Link></p>
      </div>
    </div>
  );
}
