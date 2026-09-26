"use client";

import { TasteDNAView } from "@/components/intelligence/TasteDNAView";
import { WeeklyBriefCard } from "@/components/intelligence/WeeklyBriefCard";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";

export default function MyCinemaPage() {
  const { watchlist, favorites, history, settings } = useUserLibrary();
  const movieIds = [...new Set([...watchlist, ...favorites, ...history])];

  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Personal intelligence</p>
        <h1 className="page-header__title">My Cinema</h1>
        <p className="page-header__subtitle">Taste DNA, weekly briefs, and your cinematic identity.</p>
      </header>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/my-cinema/interview" className="btn btn-secondary">AI Movie Interview</Link>
        <Link href="/intelligence/discover" className="btn btn-secondary">Discovery Lab</Link>
        <Link href="/copilot" className="btn btn-primary">Cinema Agent</Link>
        <Link href="/intelligence" className="btn btn-ghost">All 100 features</Link>
      </div>

      <section className="mt-12">
        <h2 className="section-title">Taste DNA 2.0</h2>
        <div className="mt-6">
          <TasteDNAView movieIds={movieIds} favorites={favorites} />
        </div>
      </section>

      <WeeklyBriefCard />

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <article className="ai-usage-card">
          <h2>Private Mode</h2>
          <p className="text-sm">{settings.privateMode ? "On — self-hosted routing" : "Off"}</p>
          <Link href="/settings" className="btn btn-ghost mt-4">Settings</Link>
        </article>
        <article className="ai-usage-card">
          <h2>Franchise tracker</h2>
          <p className="text-sm">Track completion from collection pages.</p>
          <Link href="/franchises" className="btn btn-ghost mt-4">Franchises</Link>
        </article>
        <article className="ai-usage-card">
          <h2>Smart Resume</h2>
          <p className="text-sm">Continue authorized playback from home.</p>
          <Link href="/" className="btn btn-ghost mt-4">Home</Link>
        </article>
      </section>
    </div>
  );
}
