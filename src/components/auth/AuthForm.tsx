"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Login failed.");
      return;
    }
    await refresh();
    router.push("/account/import");
  }

  return (
    <form onSubmit={submit} className="auth-form space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      <div className="flex flex-col gap-2 text-sm">
        <a href="/api/auth/google" className="btn btn-secondary w-full text-center">Continue with Google</a>
        <Link href="/account/reset" className="text-[var(--accent)]">Forgot password?</Link>
        <Link href="/signup" className="text-[var(--text-secondary)]">Create an account</Link>
      </div>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Signup failed.");
      return;
    }
    await refresh();
    router.push("/account/import");
  }

  return (
    <form onSubmit={submit} className="auth-form space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Display name</span>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
      <a href="/api/auth/google" className="btn btn-secondary w-full text-center">Continue with Google</a>
      <Link href="/login" className="text-sm text-[var(--text-secondary)]">Already have an account?</Link>
    </form>
  );
}
