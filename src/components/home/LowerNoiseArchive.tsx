"use client";

import { CinematicScene } from "@/components/cinematic/CinematicScene";
import { ChapterHead } from "@/components/home/ChapterHead";
import { MovieCard } from "@/components/movie/MovieCard";
import { LOWER_NOISE_RULES, sortLowerNoise, type LowerNoiseBasis, type LowerNoiseSort } from "@/lib/home/chapters";
import { cssVars } from "@/lib/motion/css-vars";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useMemo, useState } from "react";

const PAGE = LOWER_NOISE_RULES.pageSize;
const FIRST_API_PAGE = LOWER_NOISE_RULES.fetchedPages + 1;
const MAX_API_PAGE = 40;

const SORTS: Array<{ id: LowerNoiseSort; label: string }> = [
  { id: "rating", label: "Top rated" },
  { id: "votes", label: "Fewest votes" },
  { id: "newest", label: "Newest" },
];

type LoadState = "idle" | "loading" | "error" | "exhausted";

function groundedReason(movie: MovieSummary, basis: LowerNoiseBasis): string | undefined {
  if (!movie.voteAverage) return undefined;
  const rating = `Rated ${movie.voteAverage.toFixed(1)} on TMDB`;
  const votes = movie.voteCount ? ` from ${movie.voteCount.toLocaleString("en-US")} votes` : "";
  return basis === "lower-noise" ? `${rating}${votes}; not on today's trending or popular lists.` : `${rating}${votes}.`;
}

/** Chapter 05 — a quieter room: strong ratings with lower mainstream noise, rising from depth. */
export function LowerNoiseArchive({
  index,
  movies,
  reserve,
  basis,
}: {
  index: number;
  movies: MovieSummary[];
  reserve: MovieSummary[];
  basis: LowerNoiseBasis;
}) {
  const [shown, setShown] = useState(movies);
  const [pending, setPending] = useState(reserve);
  const [nextPage, setNextPage] = useState(FIRST_API_PAGE);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [sort, setSort] = useState<LowerNoiseSort>("rating");
  const initialIds = useMemo(() => new Set(movies.map((movie) => movie.id)), [movies]);
  const display = useMemo(() => sortLowerNoise(shown, sort), [shown, sort]);
  const calculated = basis === "lower-noise";

  async function showMore() {
    if (pending.length >= PAGE) {
      setShown((current) => [...current, ...pending.slice(0, PAGE)]);
      setPending((current) => current.slice(PAGE));
      return;
    }

    setLoadState("loading");
    const collected = [...pending];
    const known = new Set([...shown, ...pending].map((movie) => movie.id));
    let page = nextPage;
    let totalPages = Number.POSITIVE_INFINITY;
    try {
      while (collected.length < PAGE && page <= Math.min(totalPages, MAX_API_PAGE)) {
        const response = await fetch(`/api/movies/lower-noise?page=${page}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { totalPages: number; results: MovieSummary[] };
        totalPages = data.totalPages;
        page += 1;
        for (const movie of data.results) {
          if (known.has(movie.id)) continue;
          known.add(movie.id);
          collected.push(movie);
        }
      }
      setShown((current) => [...current, ...collected.slice(0, PAGE)]);
      setPending(collected.slice(PAGE));
      setNextPage(page);
      const exhausted = page > Math.min(totalPages, MAX_API_PAGE) && collected.length <= PAGE;
      setLoadState(exhausted ? "exhausted" : "idle");
    } catch {
      setLoadState("error");
    }
  }

  return (
    <CinematicScene
      id="hidden"
      chapter={{ index, label: "Lower noise" }}
      className="chapter chapter--archive"
      aria-labelledby="chapter-hidden-title"
    >
      <div className="chapter__inner">
        <ChapterHead
          index={index}
          marker="Lower noise"
          titleId="chapter-hidden-title"
          title="Hidden gems"
          reason="Strong ratings with lower mainstream noise."
          href="/movies?sort=rating"
          hrefLabel="Open catalog"
          basis={
            calculated
              ? {
                  kind: "Calculated signal",
                  text: `TMDB rating ${LOWER_NOISE_RULES.minRating}+ from ${LOWER_NOISE_RULES.minVotes}–${LOWER_NOISE_RULES.maxVotes.toLocaleString("en-US")} votes, released, and absent from today's trending and popular lists. Calculated from FlutterFilms catalog metadata.`,
                }
              : {
                  kind: "Database metadata",
                  text: "Too few lower-noise titles today, so these are TMDB's top rated.",
                }
          }
        />

        <div className="archive-toolbar">
          <div className="archive-toolbar__sorts" role="radiogroup" aria-label="Sort hidden gems">
            {SORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={sort === option.id}
                className={`archive-toolbar__sort ${sort === option.id ? "is-active" : ""}`}
                onClick={() => setSort(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="archive-toolbar__count" aria-live="polite">
            {display.length} titles
          </p>
        </div>

        <ol className="archive-grid">
          {display.map((movie, slot) => (
            <li
              key={movie.id}
              className="archive-grid__item"
              data-fresh={initialIds.has(movie.id) ? undefined : "true"}
              style={cssVars({ "--i": slot % PAGE })}
            >
              <MovieCard movie={movie} details={{ reason: groundedReason(movie, basis) }} />
            </li>
          ))}
        </ol>

        {calculated ? (
          <div className="archive-more">
            {loadState === "exhausted" ? (
              <p className="archive-more__note">That&apos;s every lower-noise title in today&apos;s catalog window.</p>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => void showMore()} disabled={loadState === "loading"}>
                {loadState === "loading" ? "Loading more titles…" : "Show more hidden gems"}
              </button>
            )}
            {loadState === "error" ? (
              <p className="archive-more__note" role="alert">
                The projection missed a frame — those titles didn&apos;t load. Try again.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </CinematicScene>
  );
}
