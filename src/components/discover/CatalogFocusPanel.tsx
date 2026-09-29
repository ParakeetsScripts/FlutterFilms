"use client";

import { useMovieOpen } from "@/components/cinematic/SharedTransition";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useImageColor } from "@/hooks/useImageColor";
import { languageName, ratingLabel } from "@/lib/discover/catalog-view";
import { heroSynopsis } from "@/lib/movie/detail-helpers";
import { rgbTriplet } from "@/lib/motion/color";
import { cssVars } from "@/lib/motion/css-vars";
import { moviePath } from "@/lib/slug";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRef, useState } from "react";

type Related = { forId: number; state: "loading" | "done" | "error"; movies: MovieSummary[] };

/** Inspect a film without leaving the catalog: facts, Save, Open, Ask FlutterAI, related titles. */
export function CatalogFocusPanel({ movie, onClose }: { movie: MovieSummary | null; onClose: () => void }) {
  const { toggleWatchlist, isInWatchlist } = useUserLibrary();
  const openMovie = useMovieOpen();
  const posterRef = useRef<HTMLDivElement>(null);
  const [related, setRelated] = useState<Related | null>(null);
  const color = useImageColor(movie ? getPosterUrl(movie.posterPath, "w92") : null);

  if (!movie) {
    return (
      <aside className="catalog-focus catalog-focus--idle" aria-label="Film inspector">
        <p className="micro-label">Inspector</p>
        <p className="catalog-focus__hint">Hover or tab to a film to inspect it here. Click a poster to open it.</p>
      </aside>
    );
  }

  const href = moviePath(movie.id, movie.title);
  const poster = getPosterUrl(movie.posterPath, "w342");
  const saved = isInWatchlist(movie.id);
  const overview = heroSynopsis(movie.overview, 240);
  const relatedForMovie = related?.forId === movie.id ? related : null;
  const facts = [
    movie.year,
    movie.genres.slice(0, 3).map((genre) => genre.name).join(" · "),
    languageName(movie.originalLanguage),
  ].filter(Boolean);

  async function loadRelated(id: number) {
    setRelated({ forId: id, state: "loading", movies: [] });
    try {
      const response = await fetch(`/api/movies/${id}/recommendations`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { results?: MovieSummary[] };
      setRelated({ forId: id, state: "done", movies: (data.results ?? []).slice(0, 6) });
    } catch {
      setRelated({ forId: id, state: "error", movies: [] });
    }
  }

  return (
    <aside
      className="catalog-focus"
      aria-label={`Inspecting ${movie.title}`}
      aria-live="polite"
      style={color ? cssVars({ "--scene-rgb": rgbTriplet(color) }) : undefined}
    >
      <div className="catalog-focus__head">
        <p className="micro-label">Inspector</p>
        <button type="button" className="catalog-focus__close" onClick={onClose} aria-label="Close inspector">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <Link
        href={href}
        className="catalog-focus__poster-link"
        aria-label={`Open ${movie.title}`}
        onClick={(event) => openMovie(event, { id: movie.id, href }, posterRef.current)}
      >
        <div ref={posterRef} className="catalog-focus__poster poster-fallback">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={movie.id} src={poster} alt="" decoding="async" />
          ) : (
            <span className="catalog-focus__no-poster">No poster</span>
          )}
        </div>
      </Link>
      <h2 className="catalog-focus__title">{movie.title}</h2>
      {facts.length ? <p className="catalog-focus__facts">{facts.join(" · ")}</p> : null}
      <p className="catalog-focus__rating">
        <span>{ratingLabel(movie)}</span>
        {movie.voteCount ? <span> · {movie.voteCount.toLocaleString("en-US")} votes</span> : null}
      </p>
      {overview ? <p className="catalog-focus__overview">{overview}</p> : null}
      <div className="catalog-focus__actions">
        <Link href={href} className="btn btn-primary" onClick={(event) => openMovie(event, { id: movie.id, href }, posterRef.current)}>
          Open film
        </Link>
        <button type="button" className={`btn btn-secondary ${saved ? "is-saved" : ""}`} aria-pressed={saved} onClick={() => toggleWatchlist(movie.id)}>
          {saved ? "Saved" : "Save"}
        </button>
        <Link href={`/flutter-ai?movie=${movie.id}`} className="btn btn-ghost" data-cursor="ai">
          Ask FlutterAI
        </Link>
      </div>
      <div className="catalog-focus__related">
        {relatedForMovie?.state === "done" ? (
          relatedForMovie.movies.length ? (
            <>
              <p className="micro-label">Related on TMDB</p>
              <ul className="catalog-focus__related-list">
                {relatedForMovie.movies.map((item) => {
                  const thumb = getPosterUrl(item.posterPath, "w92");
                  return (
                    <li key={item.id}>
                      <Link href={moviePath(item.id, item.title)} title={item.title} aria-label={`Open ${item.title}`}>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" loading="lazy" />
                        ) : (
                          <span>{item.title}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="catalog-focus__hint">TMDB lists no related titles for this film.</p>
          )
        ) : (
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => void loadRelated(movie.id)}
            disabled={relatedForMovie?.state === "loading"}
          >
            {relatedForMovie?.state === "loading" ? "Loading related…" : relatedForMovie?.state === "error" ? "Retry related titles" : "Show related titles"}
          </button>
        )}
      </div>
    </aside>
  );
}
