"use client";

import { CinemaPlayer } from "@/components/player/CinemaPlayer";
import type { PlaybackResolution } from "@/lib/playback/types";
import type { Movie } from "@/lib/tmdb/types";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/images";
import { formatRuntime, moviePath } from "@/lib/slug";
import Link from "next/link";

const STATUS_COPY: Record<string, string> = {
  PLAYABLE: "Authorized playback",
  AVAILABLE_EXTERNALLY: "Watch on a provider",
  TRAILER_ONLY: "Trailer preview",
  NO_PLAYBACK_SOURCE: "Unavailable",
};

export function WatchExperience({
  movie,
  playback,
  posterUrl,
}: {
  movie: Movie;
  playback: PlaybackResolution;
  posterUrl?: string;
}) {
  const backdrop = getBackdropUrl(movie.backdropPath, "w1280");
  const poster = posterUrl ?? getPosterUrl(movie.posterPath, "w500");
  const source = playback.source;
  const showPlayer = Boolean(source);
  const statusLabel = STATUS_COPY[playback.status] ?? "Unavailable";

  return (
    <div className="watch-experience">
      <div className="watch-experience__hero">
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" className="watch-experience__backdrop" />
        ) : null}
        <div className="watch-experience__scrim" />
        <div className="watch-experience__hero-content page-container">
          <Link href={moviePath(movie.id, movie.title)} className="watch-experience__back">
            ← Back to movie
          </Link>
          {!showPlayer ? (
            <div className="watch-experience__preplay">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt="" className="watch-experience__poster" />
              ) : null}
              <div>
                <p className="eyebrow">{statusLabel}</p>
                <h1 className="watch-experience__title">{movie.title}</h1>
                <p className="watch-experience__meta">
                  {[movie.year, formatRuntime(movie.runtime), source?.title].filter(Boolean).join(" · ")}
                </p>
                {playback.external.length ? (
                  <div className="watch-experience__providers">
                    {playback.external.slice(0, 4).map((offer) => (
                      <a key={offer.providerId} href={offer.url} className="btn btn-secondary" target="_blank" rel="noreferrer">
                        Open {offer.name}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[var(--text-muted)]">
                    No authorized playback source is configured for this title yet.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showPlayer && source ? (
        <div className="watch-experience__player page-container">
          <CinemaPlayer
            source={source}
            poster={poster ?? undefined}
            movieId={movie.id}
            trackProgress={playback.status === "PLAYABLE"}
          />
          <div className="watch-experience__player-meta">
            <p className="eyebrow">{statusLabel}</p>
            <h1 className="watch-experience__title">{movie.title}</h1>
            <p className="watch-experience__meta">
              {[movie.year, formatRuntime(movie.runtime), source.title].filter(Boolean).join(" · ")}
            </p>
            {playback.status !== "PLAYABLE" && (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Trailers and authorized links only — FlutterFilms does not host films.
              </p>
            )}
            {playback.status === "AVAILABLE_EXTERNALLY" && source.type === "external" ? (
              <a href={source.url} className="btn btn-primary mt-4" target="_blank" rel="noreferrer">
                Open provider
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
