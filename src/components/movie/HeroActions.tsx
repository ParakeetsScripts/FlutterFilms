"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";

export function HeroActions({
  movieId,
  playbackLabel = "Where to watch",
  playbackHref,
}: {
  movieId: number;
  playbackLabel?: string;
  playbackHref?: string;
}) {
  const { toggleWatchlist, toggleFavorite, isInWatchlist, isFavorite } = useUserLibrary();
  return (
    <>
      {playbackHref ? (
        <Link href={playbackHref} className="btn btn-primary">
          {playbackLabel}
        </Link>
      ) : (
        <span className="btn btn-secondary opacity-80">{playbackLabel}</span>
      )}
      <button type="button" onClick={() => toggleWatchlist(movieId)} className="btn btn-secondary">
        {isInWatchlist(movieId) ? "On watchlist" : "Watchlist"}
      </button>
      <button type="button" onClick={() => toggleFavorite(movieId)} className="btn btn-ghost">
        {isFavorite(movieId) ? "Favorited" : "Favorite"}
      </button>
    </>
  );
}
