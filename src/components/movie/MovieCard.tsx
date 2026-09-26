"use client";

import { RatingBadge } from "@/components/ui/RatingBadge";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import { formatReleaseBadge } from "@/lib/format";
import { formatVote, moviePath } from "@/lib/slug";
import Link from "next/link";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";

type Variant = "standard" | "compact" | "spotlight" | "search" | "watchlist" | "upcoming";

export function MovieCard({
  movie,
  variant = "standard",
  showUpdated,
}: {
  movie: MovieSummary;
  variant?: Variant;
  showUpdated?: boolean;
}) {
  const poster = getPosterUrl(movie.posterPath, variant === "compact" ? "w185" : "w342");
  const href = moviePath(movie.id, movie.title);
  const { toggleWatchlist, isInWatchlist } = useUserLibrary();
  const saved = isInWatchlist(movie.id);
  const metaLine = [movie.year, formatVote(movie.voteAverage)].filter(Boolean).join(" · ");

  if (variant === "search") {
    return (
      <article className="flex gap-4 w-full items-center min-w-0">
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md poster-fallback">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium line-clamp-2">{movie.title}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{metaLine}</p>
        </div>
        <RatingBadge source="TMDB" rating={movie.voteAverage} />
      </article>
    );
  }

  const cardClass =
    variant === "spotlight"
      ? "movie-card movie-card--spotlight"
      : variant === "upcoming"
        ? "movie-card movie-card--upcoming"
        : "movie-card";
  const releaseBadge = variant === "upcoming" ? formatReleaseBadge(movie.releaseDate) : null;

  return (
    <article className={cardClass}>
      <Link href={href} className="movie-card__link">
        <div className="movie-card__poster-wrap poster-fallback">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt={`${movie.title} poster`} className="movie-card__poster" loading="lazy" />
          ) : (
            <div className="movie-card__poster-fallback">{movie.title}</div>
          )}
          {releaseBadge ? <span className="movie-card__release-badge">{releaseBadge}</span> : null}
          <div className="movie-card__actions">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleWatchlist(movie.id);
              }}
              className={`movie-card__save ${saved ? "is-saved" : ""}`}
              aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
        <div className="movie-card__meta">
          <h3 className="movie-card__title">{movie.title}</h3>
          <p className="movie-card__sub">
            {showUpdated ? <span className="movie-card__updated">Updated · </span> : null}
            {metaLine}
          </p>
        </div>
      </Link>
    </article>
  );
}
