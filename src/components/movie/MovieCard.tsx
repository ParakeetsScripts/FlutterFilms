"use client";

import { useMotion } from "@/components/cinematic/MotionProvider";
import { useMovieOpen } from "@/components/cinematic/SharedTransition";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { formatReleaseBadge } from "@/lib/format";
import { clamp } from "@/lib/motion/progress";
import { formatVote, moviePath } from "@/lib/slug";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type Variant = "standard" | "compact" | "spotlight" | "search" | "watchlist" | "upcoming";

export type MovieCardDetails = {
  /** Grounded reason supplied by the caller (never generated here). */
  reason?: string;
};

const PREFETCH_DELAY_MS = 140;
const prefetchedPosters = new Set<string>();

function prefetchPoster(url: string | null) {
  if (!url || prefetchedPosters.has(url)) return;
  prefetchedPosters.add(url);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
}

function detailsLabel(movie: MovieSummary): string {
  return [
    movie.year,
    movie.genres.slice(0, 2).map((genre) => genre.name).join(", "),
    movie.voteAverage ? `TMDB ${movie.voteAverage.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function MovieCard({
  movie,
  variant = "standard",
  showUpdated,
  details,
}: {
  movie: MovieSummary;
  variant?: Variant;
  showUpdated?: boolean;
  details?: MovieCardDetails;
}) {
  const { toggleWatchlist, isInWatchlist } = useUserLibrary();
  const { state } = useMotion();
  const openMovie = useMovieOpen();
  const [imageFailed, setImageFailed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const tiltFrame = useRef(0);
  const posterRect = useRef<DOMRect | null>(null);
  const prefetchTimer = useRef(0);

  const poster = imageFailed ? null : getPosterUrl(movie.posterPath, variant === "compact" ? "w185" : "w342");
  const href = moviePath(movie.id, movie.title);
  const saved = isInWatchlist(movie.id);
  const metaLine = [movie.year, formatVote(movie.voteAverage)].filter(Boolean).join(" · ");

  useEffect(
    () => () => {
      cancelAnimationFrame(tiltFrame.current);
      window.clearTimeout(prefetchTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 650);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  if (variant === "search") {
    return (
      <article className="flex gap-4 w-full items-center min-w-0">
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md poster-fallback">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setImageFailed(true)} />
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

  const cardClass = [
    "movie-card",
    variant === "spotlight" ? "movie-card--spotlight" : null,
    variant === "upcoming" ? "movie-card--upcoming" : null,
    variant === "compact" ? "movie-card--compact" : null,
    details ? "movie-card--flippable" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const releaseBadge = variant === "upcoming" ? formatReleaseBadge(movie.releaseDate) : null;
  const linkLabel = details ? `Open ${movie.title} — ${detailsLabel(movie)}` : `Open ${movie.title}`;

  function resetTilt() {
    cancelAnimationFrame(tiltFrame.current);
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
    delete card.dataset.tilt;
  }

  function onPointerEnter(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    posterRect.current = posterRef.current?.getBoundingClientRect() ?? null;
    window.clearTimeout(prefetchTimer.current);
    prefetchTimer.current = window.setTimeout(
      () => prefetchPoster(getPosterUrl(movie.posterPath, "w500")),
      PREFETCH_DELAY_MS,
    );
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!state.pointerEffects || event.pointerType !== "mouse" || flipped) return;
    const rect = posterRect.current;
    const card = cardRef.current;
    if (!rect || !card) return;
    const x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    cancelAnimationFrame(tiltFrame.current);
    tiltFrame.current = requestAnimationFrame(() => {
      card.style.setProperty("--tilt-x", x.toFixed(3));
      card.style.setProperty("--tilt-y", y.toFixed(3));
      card.dataset.tilt = "on";
    });
  }

  function onPointerLeave() {
    window.clearTimeout(prefetchTimer.current);
    posterRect.current = null;
    resetTilt();
  }

  function onSave() {
    const willSave = !saved;
    toggleWatchlist(movie.id);
    if (willSave) setJustSaved(true);
  }

  return (
    <article
      ref={cardRef}
      className={cardClass}
      data-flipped={flipped ? "true" : undefined}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <Link
        href={href}
        className="movie-card__link"
        aria-label={linkLabel}
        data-cursor="open"
        onClick={(event) => openMovie(event, { id: movie.id, href }, posterRef.current)}
      >
        <div className="movie-card__faces">
          <div ref={posterRef} className="movie-card__poster-wrap poster-fallback">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                className="movie-card__poster"
                loading="lazy"
                decoding="async"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="movie-card__poster-fallback">
                <span>{movie.title}</span>
              </div>
            )}
            <span className="movie-card__glare" aria-hidden="true" />
            {releaseBadge ? <span className="movie-card__release-badge">{releaseBadge}</span> : null}
          </div>
          {details ? (
            <div className="movie-card__back" aria-hidden="true">
              <p className="movie-card__back-title">{movie.title}</p>
              <dl className="movie-card__back-facts">
                {movie.year ? (
                  <div>
                    <dt>Year</dt>
                    <dd>{movie.year}</dd>
                  </div>
                ) : null}
                {movie.genres.length ? (
                  <div>
                    <dt>Genres</dt>
                    <dd>{movie.genres.slice(0, 2).map((genre) => genre.name).join(" · ")}</dd>
                  </div>
                ) : null}
                {movie.voteAverage ? (
                  <div>
                    <dt>TMDB</dt>
                    <dd>
                      {movie.voteAverage.toFixed(1)}
                      {movie.voteCount ? ` · ${movie.voteCount.toLocaleString("en-US")} votes` : ""}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {details.reason ? (
                <p className="movie-card__back-reason">
                  <span>Why it&apos;s here</span>
                  {details.reason}
                </p>
              ) : null}
              <span className="movie-card__back-cta">Open →</span>
            </div>
          ) : null}
        </div>
        <div className="movie-card__meta">
          <h3 className="movie-card__title">{movie.title}</h3>
          <p className="movie-card__sub">
            {showUpdated ? <span className="movie-card__updated">Updated · </span> : null}
            {metaLine}
          </p>
        </div>
      </Link>
      <div className="movie-card__actions">
        <button
          type="button"
          onClick={onSave}
          className={`movie-card__save ${saved ? "is-saved" : ""} ${justSaved ? "just-saved" : ""}`}
          aria-label={saved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}
          aria-pressed={saved}
        >
          {saved ? "Saved" : "Save"}
        </button>
        {details ? (
          <button
            type="button"
            className="movie-card__flip"
            aria-pressed={flipped}
            aria-label={flipped ? `Show poster for ${movie.title}` : `Show details for ${movie.title}`}
            onClick={() => {
              resetTilt();
              setFlipped((value) => !value);
            }}
          >
            {flipped ? "Poster" : "Details"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
