"use client";

import { CinematicScene } from "@/components/cinematic/CinematicScene";
import { useMovieOpen } from "@/components/cinematic/SharedTransition";
import { ChapterHead } from "@/components/home/ChapterHead";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useImageColor } from "@/hooks/useImageColor";
import { heroSynopsis } from "@/lib/movie/detail-helpers";
import { rgbTriplet } from "@/lib/motion/color";
import { cssVars } from "@/lib/motion/css-vars";
import { circularOffset, wrapIndex } from "@/lib/motion/progress";
import { moviePath } from "@/lib/slug";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const SWIPE_THRESHOLD_PX = 40;
const VISIBLE_RADIUS = 2;

/** Chapter 03 — a portal: the active poster at center, neighbours angled away in depth. */
export function ExplorePortal({
  index,
  movies,
  excludesLibrary,
}: {
  index: number;
  movies: MovieSummary[];
  excludesLibrary: boolean;
}) {
  const [active, setActive] = useState(0);
  const activePosterRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);
  const { toggleWatchlist, isInWatchlist } = useUserLibrary();
  const openMovie = useMovieOpen();
  const count = movies.length;
  const current = movies[wrapIndex(active, count)];
  const color = useImageColor(getPosterUrl(current?.posterPath, "w92"));

  if (!current) return null;

  const go = (next: number) => setActive(wrapIndex(next, count));
  const href = moviePath(current.id, current.title);
  const saved = isInWatchlist(current.id);
  const facts = [current.year, current.genres.slice(0, 3).map((genre) => genre.name).join(" · ")].filter(Boolean);
  const overview = heroSynopsis(current.overview, 180);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(active - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(active + 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    swipe.current = { x: event.clientX, moved: false };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      start.moved = true;
      go(active + (dx < 0 ? 1 : -1));
    }
  }

  return (
    <CinematicScene
      id="explore"
      chapter={{ index, label: "Explore" }}
      className="chapter chapter--explore"
      style={color ? cssVars({ "--scene-rgb": rgbTriplet(color) }) : undefined}
      aria-labelledby="chapter-explore-title"
    >
      <div className="chapter__inner">
        <ChapterHead
          index={index}
          marker="Farther from familiar"
          titleId="chapter-explore-title"
          title="Explore outside your taste"
          reason={`Highly rated titles you may not have considered.${
            excludesLibrary ? " Anything already in your history, favorites, or watchlist is left out." : ""
          }`}
          href="/movies"
          hrefLabel="Discover"
        />

        <div className="explore-portal">
          <div
            className="explore-portal__stage"
            role="region"
            aria-roledescription="carousel"
            aria-label="Titles outside your usual picks. Use the left and right arrow keys to move."
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onClickCapture={(event) => {
              if (swipe.current?.moved) {
                event.preventDefault();
                event.stopPropagation();
              }
              swipe.current = null;
            }}
          >
            <div className="explore-portal__ring" aria-hidden="true" />
            <ol className="explore-portal__track">
              {movies.map((movie, slide) => {
                const offset = circularOffset(slide, active, count);
                const isActive = offset === 0;
                const poster = getPosterUrl(movie.posterPath, "w342");
                const slideHref = moviePath(movie.id, movie.title);
                return (
                  <li
                    key={movie.id}
                    className="explore-portal__slide"
                    data-active={isActive ? "true" : undefined}
                    data-visible={Math.abs(offset) <= VISIBLE_RADIUS ? "true" : undefined}
                    aria-hidden={!isActive}
                    aria-roledescription="slide"
                    aria-label={`${slide + 1} of ${count}: ${movie.title}`}
                    style={cssVars({ "--offset": offset, "--dist": Math.abs(offset) })}
                  >
                    <Link
                      href={slideHref}
                      tabIndex={isActive ? 0 : -1}
                      aria-label={`Open ${movie.title}`}
                      data-cursor={isActive ? "open" : "explore"}
                      className="explore-portal__link"
                      onClick={(event) => {
                        if (!isActive) {
                          event.preventDefault();
                          go(slide);
                          return;
                        }
                        openMovie(event, { id: movie.id, href: slideHref }, activePosterRef.current);
                      }}
                    >
                      <div ref={isActive ? activePosterRef : undefined} className="explore-portal__poster poster-fallback">
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={poster} alt="" loading="lazy" decoding="async" draggable={false} />
                        ) : (
                          <span className="explore-portal__poster-title">{movie.title}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="explore-portal__detail">
            <p className="micro-label" aria-live="polite">
              {wrapIndex(active, count) + 1} / {count} · {current.title}
            </p>
            <h3 className="explore-portal__title">{current.title}</h3>
            {facts.length ? <p className="explore-portal__facts">{facts.join(" · ")}</p> : null}
            {current.voteAverage ? (
              <p className="explore-portal__rating">
                <span className="micro-label">TMDB</span> {current.voteAverage.toFixed(1)}
                {current.voteCount ? ` · ${current.voteCount.toLocaleString("en-US")} votes` : ""}
              </p>
            ) : null}
            {overview ? <p className="explore-portal__overview">{overview}</p> : null}
            <div className="explore-portal__actions">
              <Link
                href={href}
                className="btn btn-primary"
                onClick={(event) => openMovie(event, { id: current.id, href }, activePosterRef.current)}
              >
                Open
              </Link>
              <button
                type="button"
                className={`btn btn-ghost ${saved ? "is-saved" : ""}`}
                aria-pressed={saved}
                onClick={() => toggleWatchlist(current.id)}
              >
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <div className="explore-portal__controls">
              <button type="button" className="explore-portal__arrow" aria-label="Previous title" onClick={() => go(active - 1)}>
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" className="explore-portal__arrow" aria-label="Next title" onClick={() => go(active + 1)}>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </CinematicScene>
  );
}
