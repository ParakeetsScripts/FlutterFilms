import { RatingBadge } from "@/components/ui/RatingBadge";
import type { Movie } from "@/lib/tmdb/types";

/** @deprecated Use hero ratings in MovieDetailView */
export function SourceRatings({ movie }: { movie: Movie }) {
  const tmdbRating = movie.tmdbRating ?? movie.voteAverage;
  const tmdbVotes = movie.tmdbVoteCount ?? movie.voteCount;

  return (
    <div className="detail-hero-v2__ratings">
      <RatingBadge source="TMDB" rating={tmdbRating} voteCount={tmdbVotes} variant="stacked" />
      <RatingBadge source="IMDb" rating={movie.imdbRating} voteCount={movie.imdbVoteCount} variant="stacked" />
    </div>
  );
}
