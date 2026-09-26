"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [library, setLibrary] = useState<{ watchlist: number[]; favorites: number[]; history: unknown[] } | null>(null);

  useEffect(() => {
    if (ready && !user) router.push("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/user/sync")
      .then((r) => r.json())
      .then((data) => setLibrary(data.library));
  }, [user]);

  if (!ready || !user) return <p className="page-container page-section text-sm text-[var(--muted)]">Loading account…</p>;

  return (
    <div className="page-container page-section max-w-3xl">
      <header className="page-header">
        <p className="eyebrow">Account</p>
        <h1 className="page-header__title">{user.displayName ?? user.email}</h1>
        <p className="page-header__subtitle">Profile visibility: {user.profileVisibility}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="ai-usage-card">
          <h2 className="section-title">Your library</h2>
          <p className="mt-2 text-sm">Watchlist: {library?.watchlist.length ?? 0}</p>
          <p className="text-sm">Favorites: {library?.favorites.length ?? 0}</p>
          <p className="text-sm">History: {library?.history.length ?? 0}</p>
        </article>
        <article className="ai-usage-card">
          <h2 className="section-title">Intelligence</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/my-cinema" className="text-[var(--accent)]">Taste DNA</Link>
            <Link href="/account/memories" className="text-[var(--accent)]">Cinema Agent memories</Link>
            <Link href="/tonight" className="text-[var(--accent)]">Tonight picker</Link>
            <Link href="/rooms" className="text-[var(--accent)]">Movie rooms</Link>
          </div>
        </article>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/settings" className="btn btn-secondary">Settings</Link>
        <button type="button" className="btn btn-ghost" onClick={() => logout().then(() => router.push("/"))}>Sign out</button>
      </div>
    </div>
  );
}
