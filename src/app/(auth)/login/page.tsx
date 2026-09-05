"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock } from "lucide-react";
import { IconField } from "@/components/ui/IconField";
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

    // In NextAuth v5 beta the client signIn can throw on the success redirect
    // even though the session cookie is set; treat a thrown call as success and
    // only surface an explicit result.error.
    try {
      const result = await signIn("credentials", { phone, password, redirect: false });
      if (result?.error) {
        setError("Invalid phone number or password");
        setLoading(false);
        return;
      }
    } catch {
      // fall through — cookie is likely set
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--panel)]/95 backdrop-blur-sm border border-[var(--line)] shadow-warm-3 p-7 sm:p-8 text-center">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">
        Sign in to manage your rooms, rentals and account.
      </p>

      {error && (
        <div className="mt-5 rounded-[var(--radius)] bg-[var(--danger-wash)] border border-[var(--danger)]/30 p-3 text-sm text-[var(--danger)] animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
        <IconField
          icon={<Phone className="w-4 h-4" />}
          type="tel"
          placeholder="+977 98XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <IconField
          icon={<Lock className="w-4 h-4" />}
          password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button size="lg" className="w-full mt-1" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--ink-2)]">
        New to NayaGhar?{" "}
        <Link href="/register" className="font-semibold text-[var(--brick)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
