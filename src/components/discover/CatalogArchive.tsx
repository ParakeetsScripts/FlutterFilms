"use client";

import { useMovieOpen } from "@/components/cinematic/SharedTransition";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { languageName, ratingLabel, resultPosition } from "@/lib/discover/catalog-view";
import { moviePath } from "@/lib/slug";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRef } from "react";

/** Archive view: a dense, information-first index for power users. Also the lowest-motion view. */
export function CatalogArchive({ movies, firstPage }: { movies: MovieSummary[]; firstPage: number }) {
  return (
    <ol className="catalog-archive" aria-label="Catalog results, archive view">
      {movies.map((movie, index) => (
        <ArchiveRow key={movie.id} movie={movie} position={resultPosition(firstPage, index)} />
      ))}
    </ol>
  );
}

function ArchiveRow({ movie, position }: { movie: MovieSummary; position: number }) {
  const { toggleWatchlist, isInWatchlist } = useUserLibrary();
  const openMovie = useMovieOpen();
  const thumbRef = useRef<HTMLSpanElement>(null);
  const href = moviePath(movie.id, movie.title);
  const thumb = getPosterUrl(movie.posterPath, "w92");
  const saved = isInWatchlist(movie.id);

  return (
    <li className="catalog-archive__row" data-movie-id={movie.id}>
      <span className="catalog-archive__rank" aria-label={`Result ${position}`}>
        {String(position).padStart(3, "0")}
      </span>
      <span ref={thumbRef} className="catalog-archive__thumb poster-fallback" aria-hidden="true">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy" decoding="async" />
        ) : null}
      </span>
      <span className="catalog-archive__main">
        <Link href={href} className="catalog-archive__title" onClick={(event) => openMovie(event, { id: movie.id, href }, thumbRef.current)}>
          {movie.title}
        </Link>
        <span className="catalog-archive__genres">{movie.genres.slice(0, 3).map((genre) => genre.name).join(" · ") || "Genres unavailable"}</span>
      </span>
      <span className="catalog-archive__cell">{movie.year ?? "Year unknown"}</span>
      <span className="catalog-archive__cell">{languageName(movie.originalLanguage) ?? "—"}</span>
      <span className="catalog-archive__cell catalog-archive__rating">{ratingLabel(movie)}</span>
      <span className="catalog-archive__cell catalog-archive__votes">
        {movie.voteCount ? `${movie.voteCount.toLocaleString("en-US")} votes` : "No votes"}
      </span>
      <button
        type="button"
        className={`movie-card__save catalog-archive__save ${saved ? "is-saved" : ""}`}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
        onClick={() => toggleWatchlist(movie.id)}
      >
        {saved ? "Saved" : "Save"}
      </button>
    </li>
  );
}
