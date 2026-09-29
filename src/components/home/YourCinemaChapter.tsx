"use client";

import { CinematicScene } from "@/components/cinematic/CinematicScene";
import { BecauseYouWatchedSection } from "@/components/home/BecauseYouWatchedSection";
import { ChapterHead } from "@/components/home/ChapterHead";
import { MovieRow } from "@/components/movie/MovieRow";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { SITE_NAME } from "@/lib/brand";
import { cssVars } from "@/lib/motion/css-vars";
import { genreName } from "@/lib/tmdb/genres";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";

/** Chapter 06 — the viewer's own cinema. Only renders data the product actually holds. */
export function YourCinemaChapter({
  index,
  showOnboarding,
  isReturning,
  personalized,
  watchlistMovies,
}: {
  index: number;
  showOnboarding: boolean;
  isReturning: boolean;
  personalized: boolean;
  watchlistMovies: MovieSummary[];
}) {
  const { settings, watchlist, favorites, history } = useUserLibrary();
  const tasteGenres = settings.favoriteGenres.map(genreName).filter(Boolean);
  const hasLibrary = watchlist.length + favorites.length + history.length > 0;

  if (!showOnboarding && !hasLibrary && !tasteGenres.length) return null;

  return (
    <CinematicScene
      id="yours"
      chapter={{ index, label: "Yours" }}
      className="chapter chapter--yours"
      aria-labelledby={showOnboarding ? "chapter-yours-door" : "chapter-yours-title"}
    >
      <div className="chapter__inner">
        {showOnboarding ? (
          <Link href="/onboarding" className="cinema-doorway" data-cursor="explore" aria-labelledby="chapter-yours-door">
            <span className="cinema-doorway__frame" aria-hidden="true">
              <span className="cinema-doorway__light" />
              <span className="cinema-doorway__door cinema-doorway__door--left" />
              <span className="cinema-doorway__door cinema-doorway__door--right" />
            </span>
            <span className="cinema-doorway__copy">
              <span className="chapter-marker">{String(index).padStart(2, "0")} — Your cinema</span>
              <span id="chapter-yours-door" className="cinema-doorway__title">
                New here? Build your taste in minutes.
              </span>
              <span className="cinema-doorway__body">
                Favorite movies, genres, and filmmakers. {SITE_NAME} uses only what you choose.
              </span>
              <span className="btn btn-primary cinema-doorway__cta">Start onboarding</span>
            </span>
          </Link>
        ) : (
          <>
            <ChapterHead
              index={index}
              marker="Your cinema"
              titleId="chapter-yours-title"
              title="Your cinema"
              reason="Built only from what you've saved, favorited, watched, and chosen in onboarding."
              href="/my-cinema"
              hrefLabel="My Cinema"
            />
            <dl className="cinema-ledger">
              <div>
                <dt>Watchlist</dt>
                <dd>{watchlist.length}</dd>
              </div>
              <div>
                <dt>Favorites</dt>
                <dd>{favorites.length}</dd>
              </div>
              <div>
                <dt>Watched</dt>
                <dd>{history.length}</dd>
              </div>
            </dl>
            {tasteGenres.length ? (
              <div className="taste-markers">
                <p className="micro-label">Film DNA · genres you chose in onboarding</p>
                <ul className="taste-markers__list">
                  {tasteGenres.map((name, slot) => (
                    <li key={name} className="taste-marker" style={cssVars({ "--i": slot })}>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {personalized ? <BecauseYouWatchedSection /> : null}
            {watchlistMovies.length ? (
              <section className="yours-shelf" aria-labelledby="yours-watchlist-title">
                <div className="yours-shelf__head">
                  <h3 id="yours-watchlist-title" className="yours-shelf__title">
                    Your watchlist
                  </h3>
                  <Link href="/watchlist" className="btn btn-ghost text-sm">
                    Open
                  </Link>
                </div>
                <MovieRow title="" movies={watchlistMovies} bare railId="home-watchlist" depth="arc" />
              </section>
            ) : null}
            {isReturning ? (
              <Link href="/rooms" className="rooms-invite">
                <span className="micro-label">Movie rooms</span>
                <span className="rooms-invite__title">Plan movie night with friends — vote together.</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </>
        )}
      </div>
    </CinematicScene>
  );
}
