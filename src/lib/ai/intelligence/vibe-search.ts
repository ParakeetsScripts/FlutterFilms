import "server-only";

import { discoverMovies } from "@/lib/tmdb/discover";
import { getPopularMovies, getTopRatedMovies, getTrendingMovies } from "@/lib/tmdb/movies";
import { getRecommendations } from "@/lib/tmdb/recommendations";
import { searchMovies } from "@/lib/tmdb/search";
import { getSimilarMovies } from "@/lib/tmdb/similar";
import type { MovieSummary } from "@/lib/tmdb/types";
import { trustBadge } from "../trust";
import { parseVibeQuery } from "./vibe-query";
import { applyTasteFilters, type VibeTasteContext } from "./vibe-taste";

function mergeMovies(target: MovieSummary[], source: MovieSummary[], seen: Set<number>) {
  for (const movie of source) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    target.push(movie);
  }
}

function withoutAnchor(movies: MovieSummary[], anchorId?: number) {
  if (!anchorId) return movies;
  return movies.filter((movie) => movie.id !== anchorId);
}

async function discoverGenre(genre: number | undefined, options: {
  runtimeLte?: number;
  ratingGte?: number;
  sort?: "popularity" | "rating";
}) {
  return discoverMovies({
    genre,
    runtimeLte: options.runtimeLte,
    ratingGte: options.ratingGte,
    sort: options.sort ?? "popularity",
  });
}

async function runTonightPick(): Promise<MovieSummary[]> {
  const trending = await getTrendingMovies("day");
  const feature = trending.results.find((movie) => {
    const genres = movie.genres?.map((genre) => genre.id) ?? [];
    return !genres.includes(99) && (movie.voteAverage ?? 0) >= 5;
  });
  return [feature ?? trending.results[0]].filter(Boolean);
}

function pickAnchorMovie(results: MovieSummary[], referenceTitle: string): MovieSummary | undefined {
  if (!results.length) return undefined;
  const target = referenceTitle.toLowerCase();
  const exact = results.find((movie) => movie.title.toLowerCase() === target);
  if (exact) return exact;
  const starts = results.find((movie) => movie.title.toLowerCase().startsWith(target));
  if (starts) return starts;
  return [...results].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))[0];
}

function rankReferenceTwist(
  movies: MovieSummary[],
  similarIds: Set<number>,
  twistGenreIds: number[],
): MovieSummary[] {
  return [...movies].sort((a, b) => {
    const score = (movie: MovieSummary) => {
      let value = movie.voteAverage ?? 0;
      if (similarIds.has(movie.id)) value += 20;
      const genreIds = movie.genres?.map((genre) => genre.id) ?? [];
      if (twistGenreIds.some((id) => genreIds.includes(id))) value += 10;
      if (twistGenreIds.includes(35) && genreIds.includes(878) && genreIds.includes(35)) value += 15;
      return value;
    };
    return score(b) - score(a);
  });
}

async function runReferenceTwist(parsed: ReturnType<typeof parseVibeQuery>): Promise<{
  movies: MovieSummary[];
  anchorTitle?: string;
  anchorId?: number;
}> {
  const merged: MovieSummary[] = [];
  const seen = new Set<number>();
  const similarIds = new Set<number>();
  let anchorTitle: string | undefined;
  let anchorId: number | undefined;

  if (!parsed.referenceTitle) return { movies: merged };

  const found = await searchMovies(parsed.referenceTitle, 1);
  const anchor = pickAnchorMovie(found.results, parsed.referenceTitle);
  if (!anchor) return { movies: merged };

  anchorTitle = anchor.title;
  anchorId = anchor.id;

  const [recs, similar] = await Promise.all([
    getRecommendations(anchor.id).catch(() => ({ results: [] as MovieSummary[] })),
    getSimilarMovies(anchor.id).catch(() => ({ results: [] as MovieSummary[] })),
  ]);
  for (const movie of similar.results) similarIds.add(movie.id);
  mergeMovies(merged, similar.results, seen);
  mergeMovies(merged, recs.results, seen);

  for (const twistGenre of parsed.twistGenres) {
    const twisted = await discoverGenre(twistGenre, { ratingGte: 6, sort: "rating" });
    mergeMovies(merged, twisted.results, seen);
  }

  if (parsed.twistGenres.includes(35)) {
    const [sciFiComedy, spaceComedy] = await Promise.all([
      discoverGenre(878, { ratingGte: 6, sort: "rating" }),
      searchMovies("space comedy", 1).catch(() => ({ results: [] as MovieSummary[] })),
    ]);
    mergeMovies(merged, sciFiComedy.results, seen);
    mergeMovies(merged, spaceComedy.results, seen);
  }

  const ranked = rankReferenceTwist(withoutAnchor(merged, anchorId), similarIds, parsed.twistGenres);
  return {
    movies: ranked,
    anchorTitle,
    anchorId,
  };
}

async function runGenreFiltered(parsed: ReturnType<typeof parseVibeQuery>): Promise<MovieSummary[]> {
  const merged: MovieSummary[] = [];
  const seen = new Set<number>();
  const genres = parsed.filterGenres.length ? parsed.filterGenres : [undefined];

  for (const genre of genres) {
    const discovered = await discoverGenre(genre, {
      runtimeLte: parsed.runtimeLte,
      ratingGte: parsed.ratingGte,
      sort: parsed.runtimeLte ? "rating" : "popularity",
    });
    mergeMovies(merged, discovered.results, seen);
  }

  return merged;
}

async function runExploreOutside(taste?: VibeTasteContext): Promise<MovieSummary[]> {
  const merged: MovieSummary[] = [];
  const seen = new Set<number>();

  const [topRated, discovered] = await Promise.all([
    getTopRatedMovies().catch(() => ({ results: [] as MovieSummary[] })),
    discoverMovies({ ratingGte: 7.5, sort: "rating" }).catch(() => ({ results: [] as MovieSummary[] })),
  ]);

  mergeMovies(merged, topRated.results, seen);
  mergeMovies(merged, discovered.results, seen);

  const filtered = applyTasteFilters(merged, taste);
  if (filtered.length >= 6) return filtered;

  const popular = await getPopularMovies().catch(() => ({ results: [] as MovieSummary[] }));
  mergeMovies(merged, popular.results, seen);
  return applyTasteFilters(merged, taste);
}

async function runGeneral(parsed: ReturnType<typeof parseVibeQuery>): Promise<MovieSummary[]> {
  const merged: MovieSummary[] = [];
  const seen = new Set<number>();

  for (const keyword of parsed.keywords) {
    try {
      const results = await searchMovies(keyword, 1);
      mergeMovies(merged, results.results, seen);
    } catch {
      // Continue.
    }
  }

  if (merged.length < 6) {
    const trending = await getTrendingMovies("day");
    mergeMovies(merged, trending.results, seen);
  }
  if (merged.length < 6) {
    const popular = await getPopularMovies();
    mergeMovies(merged, popular.results, seen);
  }

  return merged;
}

function buildInterpretation(
  parsed: ReturnType<typeof parseVibeQuery>,
  movies: MovieSummary[],
  anchorTitle?: string,
): string {
  if (parsed.mode === "tonight_pick" && movies[0]) {
    return `Tonight: ${movies[0].title}`;
  }
  if (parsed.mode === "reference_twist" && anchorTitle) {
    const twist = parsed.twistGenres.includes(35) ? "with a comedy angle" : "with your twist";
    return `Movies like ${anchorTitle} ${twist}`;
  }
  if (parsed.mode === "genre_filtered") {
    const parts = [...parsed.notes];
    if (parsed.runtimeLte) parts.push(`Under ${Math.round(parsed.runtimeLte / 60)}h`);
    return parts.join(" · ");
  }
  if (parsed.mode === "explore_outside") {
    return "Highly rated picks outside your usual watchlist";
  }
  return parsed.notes.join(" · ") || "Picked for your mood";
}

export async function vibeSearch(query: string, taste?: VibeTasteContext) {
  const parsed = parseVibeQuery(query);
  let movies: MovieSummary[] = [];
  let anchorTitle: string | undefined;

  switch (parsed.mode) {
    case "tonight_pick":
      movies = await runTonightPick();
      break;
    case "reference_twist": {
      const twist = await runReferenceTwist(parsed);
      movies = twist.movies;
      anchorTitle = twist.anchorTitle;
      break;
    }
    case "genre_filtered":
      movies = await runGenreFiltered(parsed);
      break;
    case "explore_outside":
      movies = await runExploreOutside(taste);
      break;
    default:
      movies = await runGeneral(parsed);
  }

  if (!movies.length) {
    const trending = await getTrendingMovies("day").catch(() => ({ results: [] as MovieSummary[] }));
    movies = trending.results;
  }

  const limit = parsed.resultLimit;
  return {
    query: query.trim(),
    mode: parsed.mode,
    interpretation: buildInterpretation(parsed, movies, anchorTitle),
    results: movies.slice(0, limit),
    limit,
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
  };
}
