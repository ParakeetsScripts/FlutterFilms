"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import { usePointerTarget } from "@/components/cinematic/CinematicScene";
import { MovieCard } from "@/components/movie/MovieCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { layoutSolarSystem, planetAngle } from "@/lib/discover/solar-system";
import { cssVars } from "@/lib/motion/css-vars";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useEffect, useMemo, useRef } from "react";

/** Fixed starfield — decoration only, not catalog data. */
const STARS: ReadonlyArray<[number, number, number]> = [
  [6, 10, 0.35],
  [12, 28, 0.2],
  [18, 8, 0.45],
  [24, 62, 0.18],
  [31, 16, 0.3],
  [38, 74, 0.22],
  [44, 6, 0.4],
  [51, 42, 0.16],
  [58, 88, 0.28],
  [64, 14, 0.2],
  [71, 56, 0.34],
  [77, 22, 0.18],
  [83, 70, 0.26],
  [89, 9, 0.38],
  [93, 48, 0.15],
  [8, 82, 0.24],
  [16, 48, 0.14],
  [27, 91, 0.3],
  [42, 33, 0.2],
  [55, 12, 0.32],
  [68, 81, 0.16],
  [80, 36, 0.28],
  [91, 78, 0.2],
  [4, 54, 0.18],
  [47, 64, 0.12],
];

/**
 * Solar-system layout of the currently loaded catalog page.
 * Center = first title in the current sort (or the focused title).
 * Rings follow remaining catalog order. Orbits are decorative — not similarity.
 */
export function CatalogConstellation({
  movies,
  focusId,
}: {
  movies: MovieSummary[];
  focusId: number | null;
}) {
  const reducedMotion = useReducedMotion();
  const { state } = useMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  usePointerTarget(stageRef, state.pointerEffects && !reducedMotion);
  const layout = useMemo(() => layoutSolarSystem(movies, focusId), [movies, focusId]);
  const freeze = reducedMotion || state.mode === "static" || state.mode === "reduced";
  const sunPoster = layout.sun ? getPosterUrl(layout.sun.posterPath, "w185") : null;
  const focusedIsPromoted = Boolean(layout.sun && focusId === layout.sun.id && movies[0]?.id !== layout.sun.id);

  useEffect(() => {
    const stage = stageRef.current;
    const plane = planeRef.current;
    if (!stage || !plane) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) delete plane.dataset.paused;
        else plane.dataset.paused = "true";
      },
      { threshold: 0.12 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="solar-system" aria-label="Catalog results, solar system view">
      <p className="solar-system__note">
        Center is the first title on this page, or the title you focus. Rings follow the rest of this loaded
        page, in catalog order. Orbits are decorative — not similarity, ranking, or astronomy.
      </p>

      <div ref={stageRef} className="solar-system__stage">
        <div className="solar-system__sky" aria-hidden="true">
          {STARS.map(([x, y, glow], index) => (
            <span
              key={index}
              className="solar-system__star"
              style={cssVars({ "--x": `${x}%`, "--y": `${y}%`, "--glow": glow })}
            />
          ))}
        </div>
        {sunPoster ? (
          <div className="solar-system__corona" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sunPoster} alt="" />
          </div>
        ) : null}

        <div
          ref={planeRef}
          className="solar-system__plane"
          data-motion={freeze ? "static" : "orbit"}
        >
          <span className="solar-system__haze" aria-hidden="true" />
          <span className="solar-system__belt" aria-hidden="true" />

          {layout.rings.map((ring) => (
            <div
              key={ring.index}
              className="solar-system__orbit"
              data-ring={ring.index}
              style={cssVars({
                "--radius": `${ring.radius}%`,
                "--period": `${ring.periodSec}s`,
              })}
            >
              <span className="solar-system__ring" />
              <div className="solar-system__track">
                {ring.planets.map((movie, indexOnRing) => (
                  <div
                    key={movie.id}
                    className="solar-system__slot"
                    style={cssVars({
                      "--a": `${planetAngle(indexOnRing, ring.planets.length, ring.offsetDeg)}deg`,
                    })}
                  >
                    <div
                      className="solar-system__planet"
                      data-movie-id={movie.id}
                      data-focused={movie.id === focusId ? "true" : undefined}
                    >
                      <MovieCard movie={movie} variant="compact" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {layout.sun ? (
            <div
              className="solar-system__sun"
              data-movie-id={layout.sun.id}
              data-focused={layout.sun.id === focusId ? "true" : undefined}
            >
              <MovieCard movie={layout.sun} variant="spotlight" />
            </div>
          ) : null}
        </div>

      </div>

      {layout.sun ? (
        <p className="solar-system__caption">
          <span className="micro-label">
            {focusedIsPromoted ? "Center · focused title" : "Center · first on this page"}
          </span>
          <strong>{layout.sun.title}</strong>
        </p>
      ) : null}
    </div>
  );
}
