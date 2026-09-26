"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WatchlistSummary = {
  id: string;
  title: string;
  visibility: string;
  role: string;
  movie_count: number;
};

export function SharedWatchlistsView() {
  const [lists, setLists] = useState<WatchlistSummary[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/watchlists");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Sign in to view shared lists.");
      setLists([]);
    } else {
      setLists(data.watchlists ?? []);
      setError(null);
    }
    setLoading(false);
  }

  async function create() {
    if (!title.trim()) return;
    const response = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title }),
    });
    const data = await response.json();
    if (response.ok) {
      setTitle("");
      window.location.href = `/watchlists/${data.id}`;
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading lists…</p>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="ai-usage-card">
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <Link href="/login" className="btn btn-primary mt-4">Sign in</Link>
        </div>
      )}

      {!error && (
        <>
          <section className="ai-usage-card flex flex-col gap-3 sm:flex-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New list name…"
              className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            />
            <button type="button" className="btn btn-primary" onClick={create}>Create list</button>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {lists.map((list) => (
              <Link key={list.id} href={`/watchlists/${list.id}`} className="ai-usage-card block hover:border-[var(--accent)]">
                <p className="font-medium">{list.title}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {list.movie_count} movies · {list.role.toUpperCase()}
                </p>
              </Link>
            ))}
          </div>
          {!lists.length && <p className="text-sm text-[var(--text-muted)]">No shared lists yet. Create one and invite friends.</p>}
        </>
      )}
    </div>
  );
}
