import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/images";
import type { Movie, MovieSummary } from "@/lib/tmdb/types";
import { formatRuntime, moviePath } from "@/lib/slug";
import { HeroActions } from "./HeroActions";
import { RatingBadge } from "@/components/ui/RatingBadge";
import Link from "next/link";

export function Hero({
  movie,
  label = "Featured",
  playbackLabel,
  playbackHref,
}: {
  movie: Movie | MovieSummary;
  label?: string;
  playbackLabel?: string;
  playbackHref?: string;
}) {
  const backdrop = getBackdropUrl(movie.backdropPath, "w1280");
  const poster = getPosterUrl(movie.posterPath, "w500");
  const runtime = "runtime" in movie ? formatRuntime(movie.runtime) : null;
  const genres = movie.genres.map((genre) => genre.name).slice(0, 3);

  return (
    <section className="hero-section">
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backdrop} alt="" className="hero-backdrop" />
      )}
      <div className="hero-scrim" />
      <div className="hero-content">
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={`${movie.title} poster`} className="hero-poster" />
        )}
        <div className="hero-body">
          <p className="eyebrow">{label}</p>
          <h1 className="hero-title">{movie.title}</h1>
          <div className="hero-facts">
            {movie.year ? <span>{movie.year}</span> : null}
            {runtime ? <span>{runtime}</span> : null}
            {genres.map((genre) => <span key={genre}>{genre}</span>)}
          </div>
          <div className="rating-row mt-4">
            <RatingBadge source="TMDB" rating={movie.voteAverage} voteCount={movie.voteCount} />
            {"imdbRating" in movie && movie.imdbRating != null ? (
              <RatingBadge source="IMDb" rating={movie.imdbRating} voteCount={movie.imdbVoteCount} />
            ) : null}
          </div>
          {movie.overview && <p className="hero-overview">{movie.overview.slice(0, 220)}{movie.overview.length > 220 ? "…" : ""}</p>}
          <div className="hero-actions">
            <HeroActions movieId={movie.id} playbackLabel={playbackLabel} playbackHref={playbackHref} />
            <Link href={moviePath(movie.id, movie.title)} className="btn btn-secondary">
              More info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
