"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import { useAuth } from "@/components/providers/AuthProvider";
import { track } from "@/lib/analytics/track";
import { SITE_NAME } from "@/lib/brand";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type RoomState = {
  id: string;
  owner_id: string;
  title: string;
  status: string;
  spoiler_level: string;
  locked_movie_id: number | null;
  voting_round: number;
  shareUrl: string;
  votes: Array<{ movie_id: number; votes: number }>;
  candidates: Array<{ movie_id: number }>;
  result_json: string | null;
  participants: Array<{ user_id: string | null; guest_name: string | null; preferences_json: string }>;
};

type GroupResult = {
  pick?: MovieSummary;
  alternates?: MovieSummary[];
  overlaps?: string;
  compromises?: string;
  reason?: string;
};

export function MovieRoomView({ code }: { code: string }) {
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [movies, setMovies] = useState<Record<number, MovieSummary>>({});
  const [guestName, setGuestName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [mood, setMood] = useState("balanced");
  const [genres, setGenres] = useState("");
  const [groupResult, setGroupResult] = useState<GroupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRoom = useCallback(async () => {
    const response = await fetch(`/api/rooms?code=${encodeURIComponent(code)}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Room not found.");
      return;
    }
    setRoom(data.room);
    const ids = [
      ...data.room.candidates.map((c: { movie_id: number }) => c.movie_id),
      ...data.room.votes.map((v: { movie_id: number }) => v.movie_id),
      data.room.locked_movie_id,
    ].filter(Boolean) as number[];
    const unique = [...new Set(ids)];
    const fetched: Record<number, MovieSummary> = {};
    await Promise.all(
      unique.map(async (id) => {
        const r = await fetch(`/api/movies/${id}`);
        const m = await r.json();
        if (m.movie) fetched[id] = m.movie;
      }),
    );
    setMovies((prev) => ({ ...prev, ...fetched }));
    if (data.room.result_json) {
      try {
        const parsed = JSON.parse(data.room.result_json) as GroupResult;
        setGroupResult(parsed);
      } catch { /* ignore */ }
    }
  }, [code]);

  useEffect(() => {
    void fetchRoom();
    pollRef.current = setInterval(() => void fetchRoom(), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchRoom]);

  async function join() {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join",
        code,
        guestName: user ? undefined : guestName,
        preferences: { mood, genres: genres.split(",").map((g) => g.trim()).filter(Boolean), label: user?.displayName ?? guestName },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error);
      return;
    }
    setParticipantId(data.participantId ?? user?.id ?? null);
    setJoined(true);
    track("room_joined", { code });
    void fetchRoom();
  }

  async function vote(movieId: number) {
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", code, movieId, participantId, guestName }),
    });
    track("room_vote_created", { code, movieId });
    void fetchRoom();
  }

  async function addCandidate(movieId: number) {
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_candidate", code, movieId, participantId, guestName }),
    });
    void fetchRoom();
  }

  async function groupPick() {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pick", code }),
    });
    const data = await response.json();
    if (data.pick) setGroupResult(data);
    track("room_result_generated", { code });
    void fetchRoom();
  }

  async function lockChoice(movieId: number) {
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock", code, movieId }),
    });
    void fetchRoom();
  }

  async function restartVoting() {
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restart", code }),
    });
    setGroupResult(null);
    void fetchRoom();
  }

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<MovieSummary[]>([]);

  async function searchMovies() {
    const r = await fetch(`/api/movies/search?q=${encodeURIComponent(search)}`);
    const data = await r.json();
    setSearchResults(data.results ?? []);
  }

  if (error) {
    return (
      <div className="ai-usage-card">
        <p className="text-sm text-red-300">{error}</p>
        <Link href="/rooms" className="btn btn-ghost mt-4">Back to rooms</Link>
      </div>
    );
  }

  if (!room) return <p className="text-sm text-[var(--text-muted)]">Loading room…</p>;

  const isOwner = user?.id === room.owner_id;
  const voteMap = new Map(room.votes.map((v) => [v.movie_id, v.votes]));

  return (
    <div className="room-view space-y-6 pb-24">
      <header className="room-view__header">
        <p className="eyebrow">Movie night</p>
        <h1 className="page-header__title">{room.title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Round {room.voting_round} · {room.participants.length} participants · Spoilers: {room.spoiler_level}
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Code: <code>{code}</code></p>
      </header>

      {!joined && (
        <section className="ai-usage-card space-y-3">
          {!user && (
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
          )}
          <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Mood (e.g. balanced, low energy)" className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
          <input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Genres (comma-separated)" className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
          <button type="button" className="btn btn-primary w-full" onClick={join}>Join room</button>
          <p className="text-xs text-[var(--text-muted)]">Private watch history is never shared — only what you enter here.</p>
        </section>
      )}

      {joined && (
        <>
          <section className="ai-usage-card space-y-3">
            <p className="text-sm font-medium">Add candidates</p>
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Search movies…" />
              <button type="button" className="btn btn-secondary" onClick={searchMovies}>Search</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {searchResults.slice(0, 4).map((m) => (
                <button key={m.id} type="button" onClick={() => addCandidate(m.id)} className="text-left">
                  <MovieCard movie={m} />
                  <span className="text-xs">+ Add to vote</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title">Vote</h2>
            <div className="space-y-3">
              {room.candidates.map((c) => {
                const m = movies[c.movie_id];
                if (!m) return null;
                const votes = voteMap.get(c.movie_id) ?? 0;
                return (
                  <div key={c.movie_id} className="ai-usage-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MovieCard movie={m} />
                      <span className="text-sm">{votes} vote{votes !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" className="btn btn-primary" onClick={() => vote(c.movie_id)} disabled={room.status !== "open"}>Vote</button>
                      {isOwner && (
                        <button type="button" className="btn btn-ghost text-xs" onClick={() => lockChoice(c.movie_id)}>Lock pick</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="ai-usage-card">
            <h2 className="section-title">AI Group Picker</h2>
            <button type="button" className="btn btn-secondary" onClick={groupPick}>Get group pick</button>
            {groupResult?.pick && (
              <div className="mt-4 space-y-2">
                <p className="font-medium">{groupResult.pick.title}</p>
                <p className="text-sm text-[var(--text-secondary)]"><TrustBadge kind="ai_prediction" /> {groupResult.reason}</p>
                {groupResult.overlaps && <p className="text-sm">{groupResult.overlaps}</p>}
                {groupResult.compromises && <p className="text-sm text-[var(--text-muted)]">{groupResult.compromises}</p>}
              </div>
            )}
            {isOwner && (
              <button type="button" className="btn btn-ghost mt-4" onClick={restartVoting}>Restart voting</button>
            )}
          </section>
        </>
      )}

      <p className="text-center text-xs text-[var(--text-muted)]">
        <Link href="/" className="text-[var(--accent-soft)]">Discover your movies on {SITE_NAME}</Link>
      </p>
    </div>
  );
}
