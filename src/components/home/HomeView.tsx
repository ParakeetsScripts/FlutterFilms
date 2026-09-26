"use client";

import { BecauseYouWatchedSection } from "@/components/home/BecauseYouWatchedSection";
import { HeroSearch } from "@/components/home/HeroSearch";
import { ContinueWatchingRow } from "@/components/home/ContinueWatchingRow";
import { MovieRow } from "@/components/movie/MovieRow";
import { ScrollReveal } from "@/components/scrollytelling/ScrollReveal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { HomeData } from "@/lib/home";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useMemo } from "react";

export function HomeView({ data }: { data: HomeData; defaultPlayback?: { label: string; href?: string } }) {
  const { user } = useAuth();
  const { history, watchlist, favorites, settings, ready } = useUserLibrary();
  const isReturning = Boolean(user && (history.length || watchlist.length || favorites.length));

  const watchlistMovies = useMemo(() => {
    return watchlist
      .slice(0, 8)
      .map((id) => data.heroCandidates.find((m) => m.id === id))
      .filter((m): m is MovieSummary => Boolean(m));
  }, [watchlist, data.heroCandidates]);

  const exploreOutside = data.sections.find((s) => s.id === "top-rated")?.movies.slice(0, 10) ?? [];

  const curatedSections = [
    isReturning && !settings.disablePersonalizedRows
      ? {
          id: "tonight",
          title: "Tonight's pick",
          reason: "One decision — mood, time, and taste aligned.",
          href: "/tonight",
          movies: data.sections.find((s) => s.id === "trending")?.movies.slice(0, 6) ?? [],
        }
      : null,
    watchlistMovies.length
      ? {
          id: "watchlist",
          title: "Your watchlist",
          reason: "Saved for later — synced when you sign in.",
          href: "/watchlist",
          movies: watchlistMovies,
        }
      : null,
    isReturning && !settings.disablePersonalizedRows
      ? {
          id: "new-for-you",
          title: "New for you",
          reason: "Fresh picks based on your recent activity.",
          href: "/discover",
          movies: data.sections.find((s) => s.id === "trending")?.movies.slice(0, 8) ?? [],
        }
      : null,
    isReturning
      ? {
          id: "rooms",
          title: "Movie rooms",
          reason: "Plan movie night with friends — vote together.",
          href: "/rooms",
          movies: data.sections.find((s) => s.id === "popular")?.movies.slice(0, 6) ?? [],
        }
      : {
          id: "explore",
          title: "Explore outside your taste",
          reason: "Highly rated titles you may not have considered.",
          href: "/discover",
          movies: exploreOutside,
        },
    {
      id: "new",
      title: "New releases",
      reason: "Recently updated in catalog — verified metadata only.",
      href: "/latest",
      movies: data.sections.find((s) => s.id === "upcoming")?.movies.slice(0, 8) ?? [],
    },
    {
      id: "hidden",
      title: "Hidden gems",
      reason: "Strong ratings with lower mainstream noise.",
      href: "/movies?sort=rating",
      movies: data.sections.find((s) => s.id === "top-rated")?.movies.slice(0, 8) ?? [],
    },
  ].filter((s): s is NonNullable<typeof s> => Boolean(s && s.movies.length));

  const showOnboardingPrompt = ready && !favorites.length && !history.length;

  return (
    <div className="home-redesign">
      <HeroSearch />
      {showOnboardingPrompt ? (
        <section className="home-section home-section--onboarding">
          <div className="ai-usage-card ai-usage-card--onboarding">
            <h2 className="section-title">New here?</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Build your taste in minutes — favorite movies, genres, and filmmakers.
            </p>
            <Link href="/onboarding" className="btn btn-primary mt-4">Start onboarding</Link>
          </div>
        </section>
      ) : null}
      {ready && <ContinueWatchingRow />}
      {ready && !settings.disablePersonalizedRows ? <BecauseYouWatchedSection /> : null}
      {curatedSections.map((section) => (
        <ScrollReveal key={section.id} sectionId={section.id} className="home-section">
          <div className="home-section__header">
            <div>
              <h2 className="section-title">{section.title}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{section.reason}</p>
            </div>
            {section.href ? (
              <Link href={section.href} className="btn btn-ghost text-sm shrink-0">Open</Link>
            ) : null}
          </div>
          <MovieRow title="" movies={section.movies} bare railId={`home-${section.id}`} />
        </ScrollReveal>
      ))}
    </div>
  );
}
