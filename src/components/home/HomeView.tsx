"use client";

import { ChapterIndex } from "@/components/cinematic/ChapterIndex";
import { ContinueWatchingRow } from "@/components/home/ContinueWatchingRow";
import { ExplorePortal } from "@/components/home/ExplorePortal";
import { HomeHero } from "@/components/home/HomeHero";
import { LowerNoiseArchive } from "@/components/home/LowerNoiseArchive";
import { ReleaseWall } from "@/components/home/ReleaseWall";
import { TonightChapter } from "@/components/home/TonightChapter";
import { YourCinemaChapter } from "@/components/home/YourCinemaChapter";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { HomeData } from "@/lib/home";
import { sectionMovies, selectExplore, selectLowerNoise, selectNewReleases } from "@/lib/home/chapters";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useMemo } from "react";

/**
 * The homepage as one continuous camera journey:
 * 01 Ask · 02 Tonight · 03 Explore · 04 New · 05 Lower noise · 06 Yours · end credits (footer).
 */
export function HomeView({ data, defaultPlayback }: { data: HomeData; defaultPlayback?: { label: string; href?: string } }) {
  const { user } = useAuth();
  const { history, watchlist, favorites, settings, ready } = useUserLibrary();
  const isReturning = Boolean(user && (history.length || watchlist.length || favorites.length));
  const personalized = ready && !settings.disablePersonalizedRows;

  const explore = useMemo(
    () => selectExplore(data.sections, { history, favorites, watchlist }),
    [data.sections, history, favorites, watchlist],
  );
  const releases = useMemo(() => selectNewReleases(data.sections), [data.sections]);
  const lowerNoise = useMemo(
    () => selectLowerNoise(data.sections, new Set([...explore.movies.map((movie) => movie.id), ...history])),
    [data.sections, explore.movies, history],
  );

  const watchlistMovies = useMemo(
    () =>
      watchlist
        .slice(0, 8)
        .map((id) => data.heroCandidates.find((movie) => movie.id === id))
        .filter((movie): movie is MovieSummary => Boolean(movie)),
    [watchlist, data.heroCandidates],
  );

  const alsoTrending = useMemo(
    () => sectionMovies(data.sections, "trending").filter((movie) => movie.id !== data.featured.id),
    [data.sections, data.featured.id],
  );

  const showOnboarding = ready && !settings.onboardingCompleted && !favorites.length && !history.length;

  let chapter = 1;
  const tonightIndex = ++chapter;
  const exploreIndex = explore.movies.length ? ++chapter : 0;
  const newIndex = releases.movies.length ? ++chapter : 0;
  const hiddenIndex = lowerNoise.movies.length ? ++chapter : 0;
  const yoursIndex = ++chapter;

  return (
    <div className="home-cinema mobile-page">
      <HomeHero movies={data.heroCandidates} />
      {ready ? <ContinueWatchingRow /> : null}
      <TonightChapter index={tonightIndex} featured={data.featured} playback={defaultPlayback} alsoTrending={alsoTrending} />
      {exploreIndex ? <ExplorePortal index={exploreIndex} movies={explore.movies} excludesLibrary={explore.excludesLibrary} /> : null}
      {newIndex ? <ReleaseWall index={newIndex} movies={releases.movies} basis={releases.basis} /> : null}
      {hiddenIndex ? (
        <LowerNoiseArchive index={hiddenIndex} movies={lowerNoise.movies} reserve={lowerNoise.reserve} basis={lowerNoise.basis} />
      ) : null}
      <YourCinemaChapter
        index={yoursIndex}
        showOnboarding={showOnboarding}
        isReturning={isReturning}
        personalized={personalized}
        watchlistMovies={watchlistMovies}
      />
      <ChapterIndex label="Home chapters" />
    </div>
  );
}
