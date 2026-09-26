"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type WatchlistDetail = {
  id: string;
  title: string;
  role: string;
  items: Array<{ movie_id: number; added_by: string | null; added_at: string }>;
  members: Array<{ user_id: string; role: string; display_name: string | null; email: string }>;
  activity: Array<{ action: string; movie_id: number | null; created_at: string; display_name: string | null; detail_json: string | null }>;
};

const AI_ACTIONS = [
  { id: "pick_one", label: "AI Pick One" },
  { id: "similar", label: "AI Find Similar" },
  { id: "dedupe", label: "AI Clean List" },
  { id: "complete_franchise", label: "AI Complete Franchise" },
  { id: "sort_rating", label: "AI Sort by Rating" },
  { id: "build_movie_night", label: "AI Build Movie Night" },
] as const;

export function SharedWatchlistDetail({ watchlistId }: { watchlistId: string }) {
  const [list, setList] = useState<WatchlistDetail | null>(null);
  const [movies, setMovies] = useState<Record<number, MovieSummary>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<MovieSummary[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", watchlistId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Access denied.");
      return;
    }
    setList(data);
    const ids = data.items.map((i: { movie_id: number }) => i.movie_id);
    const fetched: Record<number, MovieSummary> = {};
    await Promise.all(
      ids.map(async (id: number) => {
        const r = await fetch(`/api/movies/${id}`);
        const m = await r.json();
        if (m.movie) fetched[id] = m.movie;
      }),
    );
    setMovies(fetched);
  }, [watchlistId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addMovie(movieId: number) {
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", watchlistId, movieId }),
    });
    void load();
  }

  async function removeMovie(movieId: number) {
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", watchlistId, movieId }),
    });
    void load();
  }

  async function searchMovies() {
    const r = await fetch(`/api/movies/search?q=${encodeURIComponent(search)}`);
    const data = await r.json();
    setSearchResults(data.results ?? []);
  }

  async function invite() {
    const r = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite", watchlistId, email: inviteEmail, role: "editor" }),
    });
    const data = await r.json();
    if (!r.ok) setError(data.error);
    else {
      setInviteEmail("");
      void load();
    }
  }

  async function runAi(action: string) {
    const r = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ai", watchlistId, aiAction: action }),
    });
    const data = await r.json();
    setAiResult(data.reason ?? data.explanation ?? JSON.stringify(data.pick?.title ?? data));
  }

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!list) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;

  const canEdit = list.role === "owner" || list.role === "editor";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-header__title">{list.title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Your role: {list.role.toUpperCase()}</p>
        </div>
        <Link href={`/watchlists/share/${watchlistId}`} className="btn btn-ghost text-sm">Share</Link>
      </header>

      {list.role === "owner" && (
        <section className="ai-usage-card flex flex-col gap-2 sm:flex-row">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Invite by email…"
            className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          />
          <button type="button" className="btn btn-secondary" onClick={invite}>Invite editor</button>
        </section>
      )}

      {canEdit && (
        <section className="ai-usage-card space-y-3">
          <p className="text-sm font-medium">Add movies</p>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Search catalog…" />
            <button type="button" className="btn btn-secondary" onClick={searchMovies}>Search</button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {searchResults.slice(0, 4).map((m) => (
              <button key={m.id} type="button" onClick={() => addMovie(m.id)} className="text-left">
                <MovieCard movie={m} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Movies ({list.items.length})</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {list.items.map((item) => {
            const m = movies[item.movie_id];
            if (!m) return null;
            const member = list.members.find((x) => x.user_id === item.added_by);
            return (
              <div key={item.movie_id} className="relative">
                <MovieCard movie={m} />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {member?.display_name ?? "Someone"} · {new Date(item.added_at).toLocaleDateString()}
                </p>
                {canEdit && (
                  <button type="button" className="mt-1 text-xs text-red-300" onClick={() => removeMovie(item.movie_id)}>Remove</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="ai-usage-card">
        <h2 className="section-title">AI tools</h2>
        <div className="flex flex-wrap gap-2">
          {AI_ACTIONS.map((a) => (
            <button key={a.id} type="button" className="filter-chip" onClick={() => runAi(a.id)}>{a.label}</button>
          ))}
        </div>
        {aiResult && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            <TrustBadge kind="ai_prediction" /> {aiResult}
          </p>
        )}
      </section>

      <section className="ai-usage-card">
        <h2 className="section-title">Activity</h2>
        <ul className="space-y-2 text-sm">
          {list.activity.map((a, i) => (
            <li key={i} className="text-[var(--text-secondary)]">
              <strong>{a.display_name ?? "Someone"}</strong> {formatActivity(a.action)}
              {a.movie_id && movies[a.movie_id] ? ` — ${movies[a.movie_id].title}` : ""}
              <span className="text-[var(--text-muted)]"> · {new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formatActivity(action: string) {
  const map: Record<string, string> = {
    movie_added: "added a movie",
    movie_removed: "removed a movie",
    member_invited: "invited a collaborator",
    list_created: "created this list",
    list_renamed: "renamed the list",
    member_left: "left the list",
  };
  return map[action] ?? action.replace(/_/g, " ");
}
