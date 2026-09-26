"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";

export function MovieDetailActions({
  movieId,
  playbackLabel,
  playbackHref,
  trailerHref,
}: {
  movieId: number;
  playbackLabel: string;
  playbackHref?: string;
  trailerHref?: string;
}) {
  const { toggleWatchlist, toggleFavorite, isInWatchlist, isFavorite } = useUserLibrary();

  return (
    <div className="detail-actions">
      {playbackHref ? (
        <Link href={playbackHref} className="btn btn-primary">{playbackLabel}</Link>
      ) : (
        <span className="btn btn-secondary opacity-80">{playbackLabel}</span>
      )}
      {trailerHref ? (
        <Link href={trailerHref} className="btn btn-secondary">Trailer</Link>
      ) : null}
      <button type="button" onClick={() => toggleWatchlist(movieId)} className="btn btn-secondary">
        {isInWatchlist(movieId) ? "In watchlist" : "Watchlist"}
      </button>
      <button
        type="button"
        onClick={() => toggleFavorite(movieId)}
        className="btn btn-ghost detail-favorite"
        aria-label={isFavorite(movieId) ? "Remove from favorites" : "Add to favorites"}
        title={isFavorite(movieId) ? "Favorited" : "Favorite"}
      >
        {isFavorite(movieId) ? "♥" : "♡"}
      </button>
    </div>
  );
}
