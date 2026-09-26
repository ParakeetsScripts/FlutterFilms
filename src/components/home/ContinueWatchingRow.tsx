"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { formatProgressPercent } from "@/lib/format";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { Movie } from "@/lib/tmdb/types";
import { watchPath } from "@/lib/slug";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function ContinueWatchingRow() {
  const { continueWatching, ready } = useUserLibrary();
  const [movies, setMovies] = useState<Movie[]>([]);

  const playable = useMemo(
    () => continueWatching.filter((item) => item.kind === "movie" && item.durationSeconds > 0),
    [continueWatching],
  );

  useEffect(() => {
    if (!ready || !playable.length) {
      setMovies([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      playable.slice(0, 8).map(async (item) => {
        const response = await fetch(`/api/movies/${item.movieId}`);
        if (!response.ok) return null;
        return (await response.json()) as Movie;
      }),
    ).then((items) => {
      if (!cancelled) setMovies(items.filter((item): item is Movie => Boolean(item)));
    });
    return () => {
      cancelled = true;
    };
  }, [playable, ready]);

  if (!ready || !playable.length || !movies.length) return null;

  return (
    <section className="row-section">
      <div className="row-section__header">
        <h2 className="row-section__title">Continue Watching</h2>
      </div>
      <div className="row-scroller-wrap">
        <div className="row-scroller continue-row">
          {playable.map((item) => {
            const movie = movies.find((entry) => entry.id === item.movieId);
            if (!movie) return null;
            const poster = getPosterUrl(movie.posterPath, "w342");
            const progress = formatProgressPercent(item.positionSeconds, item.durationSeconds);
            return (
              <article key={item.movieId} className="continue-card">
                <Link href={watchPath(movie.id, movie.title)} className="continue-card__link">
                  <div className="continue-card__poster poster-fallback">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                    <div className="continue-card__progress" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="continue-card__meta">
                    <h3 className="continue-card__title">{movie.title}</h3>
                    <p className="continue-card__sub">Resume · {progress}%</p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
