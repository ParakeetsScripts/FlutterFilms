"use client";

import { CinematicScene, usePointerTarget } from "@/components/cinematic/CinematicScene";
import { useMotion } from "@/components/cinematic/MotionProvider";
import { useMovieOpen } from "@/components/cinematic/SharedTransition";
import { ChapterHead } from "@/components/home/ChapterHead";
import { MovieCard } from "@/components/movie/MovieCard";
import { CinematicRail } from "@/components/navigation/CinematicRail";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useImageColor } from "@/hooks/useImageColor";
import { heroSynopsis } from "@/lib/movie/detail-helpers";
import { rgbTriplet } from "@/lib/motion/color";
import { cssVars } from "@/lib/motion/css-vars";
import { moviePath } from "@/lib/slug";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRef } from "react";

/** Chapter 02 — one title as a spatial object: poster, text plane, and a thin metadata plane. */
export function TonightChapter({
  index,
  featured,
  playback,
  alsoTrending,
}: {
  index: number;
  featured: MovieSummary;
  playback?: { label: string; href?: string };
  alsoTrending: MovieSummary[];
}) {
  const objectRef = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const { state } = useMotion();
  const { toggleWatchlist, isInWatchlist } = useUserLibrary();
  const openMovie = useMovieOpen();
  const color = useImageColor(getPosterUrl(featured.posterPath, "w92"));
  usePointerTarget(objectRef, state.pointerEffects);

  const href = moviePath(featured.id, featured.title);
  const poster = getPosterUrl(featured.posterPath, "w500");
  const saved = isInWatchlist(featured.id);
  const facts = [featured.year, featured.genres.slice(0, 3).map((genre) => genre.name).join(" · ")].filter(Boolean);
  const overview = heroSynopsis(featured.overview, 220);

  return (
    <CinematicScene
      id="tonight"
      chapter={{ index, label: "Tonight" }}
      className="chapter chapter--tonight"
      style={color ? cssVars({ "--scene-rgb": rgbTriplet(color) }) : undefined}
      aria-labelledby="chapter-tonight-title"
    >
      <div className="chapter__inner">
        <ChapterHead
          index={index}
          marker="Tonight"
          titleId="chapter-tonight-title"
          title="Tonight starts here"
          reason="The most-watched title on TMDB today. For a pick matched to your time, mood, and attention, use Tonight."
          href="/tonight"
          hrefLabel="Personal pick →"
        />

        <div className="tonight-stage">
          <article ref={objectRef} className="tonight-object" aria-labelledby="tonight-object-title">
            <Link
              href={href}
              className="tonight-object__poster-link"
              aria-label={`Open ${featured.title}`}
              data-cursor="open"
              onClick={(event) => openMovie(event, { id: featured.id, href }, posterRef.current)}
            >
              <div ref={posterRef} className="tonight-object__poster">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt="" loading="lazy" decoding="async" />
                ) : (
                  <div className="tonight-object__poster-fallback">{featured.title}</div>
                )}
              </div>
            </Link>

            <div className="tonight-object__plane">
              <p className="micro-label">Trending today · TMDB</p>
              <h3 id="tonight-object-title" className="tonight-object__title">
                {featured.title}
              </h3>
              {facts.length ? <p className="tonight-object__facts">{facts.join(" · ")}</p> : null}
              {overview ? <p className="tonight-object__overview">{overview}</p> : null}
              <p className="tonight-object__why">
                <span className="micro-label">Why it&apos;s here</span>
                #1 on TMDB&apos;s daily trending list.
              </p>
              <div className="tonight-object__actions">
                <Link
                  href={href}
                  className="btn btn-primary"
                  data-magnetic
                  onClick={(event) => openMovie(event, { id: featured.id, href }, posterRef.current)}
                >
                  Open
                </Link>
                {playback?.href ? (
                  <Link href={playback.href} className="btn btn-secondary" data-cursor="play">
                    {playback.label}
                  </Link>
                ) : null}
                <button
                  type="button"
                  className={`btn btn-ghost ${saved ? "is-saved" : ""}`}
                  aria-pressed={saved}
                  onClick={() => toggleWatchlist(featured.id)}
                >
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <aside className="tonight-object__meta" aria-label="TMDB rating and release">
              {featured.voteAverage ? (
                <>
                  <p className="micro-label">TMDB</p>
                  <p className="tonight-object__score">{featured.voteAverage.toFixed(1)}</p>
                  {featured.voteCount ? (
                    <p className="tonight-object__votes">{featured.voteCount.toLocaleString("en-US")} votes</p>
                  ) : null}
                </>
              ) : (
                <p className="micro-label">No TMDB rating yet</p>
              )}
              {featured.releaseDate ? (
                <p className="tonight-object__release">
                  <span className="micro-label">Released</span>
                  {featured.releaseDate}
                </p>
              ) : null}
            </aside>
          </article>
        </div>

        {alsoTrending.length ? (
          <div className="tonight-also">
            <p className="micro-label">
              Also trending today · {alsoTrending.length} more from TMDB&apos;s daily list
            </p>
            <div className="tonight-also__row" role="list" aria-label="Also trending today">
              {alsoTrending.map((movie) => (
                <div key={movie.id} role="listitem" className="tonight-also__cell">
                  <MovieCard movie={movie} variant="compact" />
                </div>
              ))}
            </div>
            {alsoTrending.length > 10 ? (
              <CinematicRail label="Also trending today" storageKey="home-also-trending" depth="arc">
                {alsoTrending.map((movie) => (
                  <MovieCard key={`rail-${movie.id}`} movie={movie} />
                ))}
              </CinematicRail>
            ) : null}
          </div>
        ) : null}
      </div>
    </CinematicScene>
  );
}
