"use client";

import { getPosterUrl } from "@/lib/tmdb/images";
import type { Movie } from "@/lib/tmdb/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function StickyMovieBar({
  movie,
  playbackLabel,
  playbackHref,
  heroId,
}: {
  movie: Movie;
  playbackLabel: string;
  playbackHref?: string;
  heroId: string;
}) {
  const [visible, setVisible] = useState(false);
  const poster = getPosterUrl(movie.posterPath, "w92");

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroId]);

  if (!visible) return null;

  return (
    <div className="sticky-movie-bar">
      <div className="sticky-movie-bar__inner page-container">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="sticky-movie-bar__poster" />
        ) : null}
        <p className="sticky-movie-bar__title">{movie.title}</p>
        <div className="sticky-movie-bar__actions">
          {playbackHref ? (
            <Link href={playbackHref} className="btn btn-primary btn-sm">{playbackLabel}</Link>
          ) : (
            <span className="btn btn-secondary btn-sm opacity-80">{playbackLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
