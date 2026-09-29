"use client";

import { CinematicScene, useSceneProgress } from "@/components/cinematic/CinematicScene";
import { useMotion } from "@/components/cinematic/MotionProvider";
import { ChapterHead } from "@/components/home/ChapterHead";
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieRow } from "@/components/movie/MovieRow";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { NewReleaseBasis } from "@/lib/home/chapters";
import { cssVars } from "@/lib/motion/css-vars";
import { clamp, wallCardOffset, wallPinForCard, type WallGeometry } from "@/lib/motion/progress";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useEffect, useRef, type FocusEvent, type RefObject } from "react";

const PIN_QUERY = "(min-width: 1024px) and (min-height: 640px)";

function formatCounter(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

/** Chapter 04 — vertical scroll drives a horizontal cinema wall, then releases. */
export function ReleaseWall({ index, movies, basis }: { index: number; movies: MovieSummary[]; basis: NewReleaseBasis }) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const { state } = useMotion();
  const wide = useMediaQuery(PIN_QUERY);
  const pinned = state.scrollScenes && wide && movies.length > 3;
  const upcoming = basis === "upcoming";

  const head = (
    <ChapterHead
      index={index}
      marker="The new"
      titleId="chapter-new-title"
      title={upcoming ? "Coming soon" : "New releases"}
      reason={
        upcoming
          ? "Upcoming theatrical releases, by TMDB release date."
          : "Now playing in theaters, newest first — TMDB release dates."
      }
      href="/latest"
      hrefLabel="Latest"
    />
  );

  return (
    <CinematicScene
      id="new"
      chapter={{ index, label: "New" }}
      sceneRef={sceneRef}
      className={`chapter chapter--wall ${pinned ? "release-wall--pinned" : ""}`}
      aria-labelledby="chapter-new-title"
    >
      {pinned ? (
        <PinnedWall sceneRef={sceneRef} movies={movies} head={head} upcoming={upcoming} />
      ) : (
        <div className="chapter__inner">
          {head}
          <MovieRow title="" movies={movies} bare railId="home-new" depth="arc" upcoming={upcoming} spotlight={!upcoming} />
        </div>
      )}
    </CinematicScene>
  );
}

function PinnedWall({
  sceneRef,
  movies,
  head,
  upcoming,
}: {
  sceneRef: RefObject<HTMLElement | null>;
  movies: MovieSummary[];
  head: React.ReactNode;
  upcoming: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const geometry = useRef<WallGeometry | null>(null);
  const nearest = useRef(0);

  useEffect(() => {
    const scene = sceneRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!scene || !viewport || !track) return;

    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[1] as HTMLElement | undefined;
      if (!first) return;
      const cardWidth = first.offsetWidth;
      const gap = second ? second.offsetLeft - first.offsetLeft - cardWidth : 0;
      const viewportWidth = viewport.clientWidth;
      const distance = Math.max(0, track.scrollWidth - viewportWidth);
      geometry.current = { cardWidth, gap, paddingLeft: first.offsetLeft, distance, viewportWidth };
      scene.style.setProperty("--wall-distance", `${distance}px`);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => {
      observer.disconnect();
      scene.style.removeProperty("--wall-distance");
    };
  }, [sceneRef, movies.length]);

  useSceneProgress(sceneRef, (progress) => {
    const g = geometry.current;
    const track = trackRef.current;
    if (!g || !track) return;
    Array.from(track.children).forEach((child, slot) => {
      const offset = wallCardOffset(slot, progress.pin, g);
      const node = child as HTMLElement;
      node.style.setProperty("--wall-offset", offset.toFixed(3));
      node.style.setProperty("--wall-offset-abs", Math.abs(offset).toFixed(3));
    });
    const step = g.cardWidth + g.gap;
    const centered = step > 0 ? Math.round((progress.pin * g.distance + g.viewportWidth / 2 - g.paddingLeft - g.cardWidth / 2) / step) : 0;
    const next = clamp(centered, 0, movies.length - 1);
    if (next !== nearest.current) {
      nearest.current = next;
      if (counterRef.current) counterRef.current.textContent = formatCounter(next, movies.length);
    }
  });

  function scrollToCard(slot: number) {
    const scene = sceneRef.current;
    const g = geometry.current;
    if (!scene || !g) return;
    const target = clamp(slot, 0, movies.length - 1);
    const sceneTop = scene.getBoundingClientRect().top + window.scrollY;
    const reduced = document.documentElement.dataset.motion === "reduced";
    window.scrollTo({ top: sceneTop + wallPinForCard(target, g) * g.distance, behavior: reduced ? "auto" : "smooth" });
  }

  function onFocusCapture(event: FocusEvent<HTMLOListElement>) {
    const item = (event.target as HTMLElement).closest("li");
    const track = trackRef.current;
    if (!item || !track) return;
    const slot = Array.prototype.indexOf.call(track.children, item) as number;
    const offset = Number(item.style.getPropertyValue("--wall-offset-abs") || 0);
    if (slot >= 0 && offset > 0.75) scrollToCard(slot);
  }

  return (
    <div className="release-wall__sticky">
      <div className="chapter__inner release-wall__head">
        {head}
        <div className="release-wall__hud">
          <div className="release-wall__progress" aria-hidden="true">
            <span className="release-wall__bar" />
          </div>
          <span ref={counterRef} className="release-wall__counter" aria-hidden="true">
            {formatCounter(0, movies.length)}
          </span>
          <button type="button" className="explore-portal__arrow" aria-label="Previous release" onClick={() => scrollToCard(nearest.current - 1)}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="explore-portal__arrow" aria-label="Next release" onClick={() => scrollToCard(nearest.current + 1)}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div ref={viewportRef} className="release-wall__viewport">
        <ol ref={trackRef} className="release-wall__track" onFocusCapture={onFocusCapture}>
          {movies.map((movie, slot) => (
            <li key={movie.id} className="release-wall__card" style={cssVars({ "--i": slot })}>
              <MovieCard movie={movie} variant={upcoming ? "upcoming" : "spotlight"} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
