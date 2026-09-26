"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { userStore, type LibraryItem } from "@/lib/user/store";
import { moviePath } from "@/lib/slug";
import { useState } from "react";

type MatchResponse = {
  parsed: { title: string | null; year: number | null };
  candidates: Array<{ movie: { id: number; title: string; year: number | null }; score: number; reason: string }>;
};

export default function LibraryPage() {
  const { watchlist, favorites } = useUserLibrary();
  const [filename, setFilename] = useState("Sweeney Todd (2007).mkv");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>(() => (typeof window === "undefined" ? [] : userStore.library()));

  async function match() {
    const response = await fetch("/api/library/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    if (response.ok) setResult((await response.json()) as MatchResponse);
  }

  function confirm(movieId: number) {
    const next = [{ movieId, filename, addedAt: new Date().toISOString() }, ...library.filter((item) => item.movieId !== movieId)];
    setLibrary(next);
    userStore.setLibrary(next);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-5xl">My Library</h1>
      <p className="mt-3 text-[var(--muted)]">
        Match locally owned filenames to TMDB metadata. Files stay on your device.
      </p>
      <div className="mt-8 flex gap-6 text-sm text-[var(--muted)]">
        <span>All</span>
        <span>Watchlist {watchlist.length}</span>
        <span>Favorites {favorites.length}</span>
      </div>
      <div className="mt-8 flex gap-3">
        <input
          value={filename}
          onChange={(event) => setFilename(event.target.value)}
          className="flex-1 bg-[#141414] px-3 py-2"
        />
        <button type="button" onClick={match} className="border border-[var(--gold)] px-4 py-2 text-[var(--gold-soft)]">
          Match
        </button>
      </div>
      {result && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Parsed: {result.parsed.title ?? "Unknown"} {result.parsed.year ? `(${result.parsed.year})` : ""}
          </p>
          {result.candidates.slice(0, 5).map((candidate) => (
            <div key={candidate.movie.id} className="flex items-center justify-between border border-white/10 px-4 py-3">
              <a href={moviePath(candidate.movie.id, candidate.movie.title)}>
                {candidate.movie.title} {candidate.movie.year ? `(${candidate.movie.year})` : ""} · {candidate.reason}
              </a>
              <button type="button" onClick={() => confirm(candidate.movie.id)} className="text-sm text-[var(--gold-soft)]">
                Confirm
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-10">
        <h2 className="font-serif text-2xl">Matched titles</h2>
        {library.length === 0 && <p className="mt-3 text-sm text-[var(--muted)]">No local matches yet.</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {library.map((item) => (
            <li key={item.movieId}>
              {item.filename} → TMDB {item.movieId}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
