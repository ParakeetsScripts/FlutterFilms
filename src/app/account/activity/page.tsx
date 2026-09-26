"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { SITE_NAME } from "@/lib/brand";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type ActivitySummary = {
  watchlists: number;
  rooms: number;
  aiPrompts: number;
};

export default function AccountActivityPage() {
  const { user } = useAuth();
  const { history, watchlist, favorites, searches } = useUserLibrary();
  const [sharedLists, setSharedLists] = useState(0);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/watchlists")
      .then((r) => r.json())
      .then((d) => setSharedLists(d.watchlists?.length ?? 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    trackLocalSummary();
  }, [user]);

  async function trackLocalSummary() {
    setSummary({
      watchlists: watchlist.length,
      rooms: 0,
      aiPrompts: 0,
    });
  }

  if (!user) {
    return (
      <div className="page-container page-section max-w-2xl">
        <p className="text-sm text-[var(--text-secondary)]">Sign in to view your activity.</p>
        <Link href="/login" className="btn btn-primary mt-4">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <p className="eyebrow">Account</p>
        <h1 className="page-header__title">Your activity</h1>
        <p className="page-header__subtitle">A summary of your recent {SITE_NAME} activity. Private AI prompts are not shown in full.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="ai-usage-card">
          <h2 className="font-medium">Recent searches</h2>
          <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
            {searches.slice(0, 8).map((s) => <li key={s}>{s}</li>)}
            {!searches.length && <li>No searches yet</li>}
          </ul>
        </article>
        <article className="ai-usage-card">
          <h2 className="font-medium">Saved movies</h2>
          <p className="mt-2 text-sm">{watchlist.length} on watchlist · {favorites.length} favorites</p>
          <Link href="/watchlist" className="btn btn-ghost mt-3 text-sm">Open watchlist</Link>
        </article>
        <article className="ai-usage-card">
          <h2 className="font-medium">Watch history</h2>
          <p className="mt-2 text-sm">{history.length} recent titles</p>
          <Link href="/history" className="btn btn-ghost mt-3 text-sm">View history</Link>
        </article>
        <article className="ai-usage-card">
          <h2 className="font-medium">Social</h2>
          <p className="mt-2 text-sm">{sharedLists} shared lists</p>
          <div className="mt-3 flex gap-2">
            <Link href="/watchlists" className="btn btn-ghost text-sm">Lists</Link>
            <Link href="/rooms" className="btn btn-ghost text-sm">Rooms</Link>
          </div>
        </article>
      </div>

      <section className="ai-usage-card mt-8">
        <h2 className="font-medium">AI interactions</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Cinema Agent memories and taste signals are managed in{" "}
          <Link href="/account/memories" className="text-[var(--accent-soft)]">Agent memories</Link> and{" "}
          <Link href="/my-cinema" className="text-[var(--accent-soft)]">My Cinema</Link>.
        </p>
        {summary && <p className="mt-2 text-xs text-[var(--text-muted)]">{summary.watchlists} personal saves tracked locally.</p>}
      </section>
    </div>
  );
}
