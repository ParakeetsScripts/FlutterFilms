import "server-only";

import { filterWatchableTonight, todayIso } from "@/lib/movies/eligibility";
import { discoverMovies } from "@/lib/tmdb/discover";
import { getRecommendations } from "@/lib/tmdb/recommendations";
import { getTrendingMovies } from "@/lib/tmdb/movies";
import type { MovieSummary } from "@/lib/tmdb/types";
import { trustBadge } from "../trust";

export type RecommendMode =
  | "instant"
  | "roulette"
  | "anti_algorithm"
  | "taste_expansion"
  | "background"
  | "no_skip"
  | "comfort"
  | "hidden_gems"
  | "challenge"
  | "short_time"
  | "double_feature"
  | "weekend_marathon"
  | "family"
  | "group"
  | "regret_check";

export type RecommendContext = {
  watchlist: number[];
  favorites: number[];
  history: number[];
  negativeFeedbackIds?: number[];
  mode: RecommendMode;
  maxRuntime?: number;
  energy?: "low" | "balanced" | "high";
  brain?: "casual" | "thoughtful" | "complex" | "extreme";
  hourOfDay?: number;
  excludeIds?: number[];
  groupTasteIds?: number[][];
  language?: string;
  genreIds?: number[];
  asOf?: Date;
};

function pick<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function dedupe(movies: MovieSummary[], exclude: Set<number>) {
  return movies.filter((m) => !exclude.has(m.id));
}

function watchable(
  movies: MovieSummary[],
  ctx: RecommendContext,
): MovieSummary[] {
  return filterWatchableTonight(movies, { asOf: ctx.asOf });
}

function discoverBase(ctx: RecommendContext) {
  const asOf = ctx.asOf ?? new Date();
  return {
    releaseDateLte: todayIso(asOf),
    uiLanguage: ctx.language,
    originalLanguage: ctx.language,
    genre: ctx.genreIds?.[0],
    runtimeLte: ctx.maxRuntime,
  };
}

async function poolFromHistory(history: number[], favorites: number[], ctx: RecommendContext): Promise<MovieSummary[]> {
  const anchor = history[0] ?? favorites[0];
  let movies: MovieSummary[] = [];
  if (!anchor) {
    const trending = await getTrendingMovies("day");
    movies = trending.results;
  } else {
    const recs = await getRecommendations(anchor).catch(() => ({ results: [] }));
    movies = recs.results.length ? recs.results : (await getTrendingMovies("day")).results;
  }
  return watchable(movies, ctx);
}

function energyFilters(energy?: string) {
  if (energy === "low") return { ratingGte: 6, sort: "popularity" as const };
  if (energy === "high") return { ratingGte: 5, sort: "popularity" as const };
  return { sort: "popularity" as const };
}

function brainFilters(brain?: string) {
  if (brain === "casual") return { ratingGte: 5 };
  if (brain === "thoughtful") return { ratingGte: 6.5 };
  if (brain === "complex" || brain === "extreme") return { ratingGte: 7 };
  return {};
}

export async function runRecommendation(ctx: RecommendContext) {
  const asOf = ctx.asOf ?? new Date();
  const exclude = new Set([...ctx.history, ...(ctx.excludeIds ?? []), ...(ctx.negativeFeedbackIds ?? [])]);
  const hasHistory = ctx.history.length > 0;
  let movies: MovieSummary[] = [];
  let reason = "";
  const labels = [trustBadge("metadata")];
  const base = discoverBase(ctx);

  if (ctx.mode === "short_time" && ctx.maxRuntime) {
    const discovered = await discoverMovies({
      ...base,
      sort: "rating",
      ratingGte: 6,
      runtimeLte: ctx.maxRuntime,
      runtimeGte: 1,
    });
    movies = watchable(discovered.results.slice(0, 40), ctx);
    reason = movies.length
      ? `Released titles ≤ ${ctx.maxRuntime} min (TMDB runtime filter).`
      : `No released titles found ≤ ${ctx.maxRuntime} min with verified runtime.`;
  } else if (ctx.mode === "anti_algorithm") {
    const discovered = await discoverMovies({
      ...base,
      sort: "popularity",
      ratingGte: 6,
    });
    movies = watchable(dedupe(discovered.results, new Set(ctx.history)), ctx);
    reason = hasHistory
      ? "Outside your recent watch history."
      : "Popular released titles (no watch history on file yet).";
    labels.push(trustBadge("ai_interpretation"));
  } else if (ctx.mode === "taste_expansion") {
    const discovered = await discoverMovies({ ...base, sort: "rating", ratingGte: 7 });
    movies = watchable(dedupe(discovered.results, exclude).slice(0, 40), ctx);
    reason = "Higher-rated released titles you have not viewed recently.";
  } else if (ctx.mode === "background") {
    const discovered = await discoverMovies({ ...base, ...energyFilters("low") });
    movies = watchable(discovered.results, ctx);
    reason = "Comfortable, lower-attention picks from popularity signals.";
  } else if (ctx.mode === "roulette") {
    movies = await poolFromHistory(ctx.history, ctx.favorites, ctx);
    movies = dedupe(movies, exclude);
    reason = "Weighted random from taste-adjacent catalog recommendations.";
    labels.push(trustBadge("ai_prediction"));
  } else if (ctx.mode === "double_feature") {
    movies = await poolFromHistory(ctx.history, ctx.favorites, ctx);
    movies = dedupe(movies, exclude).slice(0, 12);
    reason = "Pairing from complementary recommendations — verify tone yourself.";
    labels.push(trustBadge("ai_interpretation"));
  } else if (ctx.mode === "weekend_marathon") {
    movies = await poolFromHistory(ctx.history, ctx.favorites, ctx);
    movies = dedupe(movies, exclude).slice(0, 8);
    reason = "Five-to-eight film marathon from your taste anchor.";
  } else if (ctx.mode === "group") {
    const groupAnchors = [...new Set(ctx.groupTasteIds?.flat() ?? ctx.watchlist)].slice(0, 6);
    const recPools = await Promise.all(
      groupAnchors.map((id) => getRecommendations(id).catch(() => ({ results: [] as MovieSummary[] }))),
    );
    const discovered = await discoverMovies({
      ...base,
      genre: ctx.genreIds?.[0],
      sort: "rating",
      ratingGte: 6,
    });
    movies = watchable(
      dedupe([...recPools.flatMap((r) => r.results), ...discovered.results], exclude),
      ctx,
    );
    reason = ctx.genreIds?.length
      ? "Group pick from shared genres and taste-adjacent recommendations."
      : "Group pick balancing recommendations from everyone's selected movies.";
    labels.push(trustBadge("ai_prediction"));
  } else {
    const filters = { ...base, ...energyFilters(ctx.energy), ...brainFilters(ctx.brain) };
    const [pool, discovered] = await Promise.all([
      poolFromHistory(ctx.history, ctx.favorites, ctx),
      discoverMovies(filters),
    ]);
    movies = watchable(dedupe([...pool, ...discovered.results], exclude), ctx);
    reason = ctx.mode === "instant" ? "Single best match from taste + discover." : `Mode: ${ctx.mode}`;
  }

  if (!movies.length) {
    const trending = await getTrendingMovies("day");
    movies = watchable(trending.results, { ...ctx, asOf });
    reason = "Fallback to trending released titles — personalize with watch history.";
  }

  const primary = pick(movies);
  const secondary =
    ctx.mode === "double_feature" ? pick(movies.filter((m) => m.id !== primary?.id)) : undefined;
  const marathon = ctx.mode === "weekend_marathon" ? movies.slice(0, 8) : movies.slice(0, 5);

  if (ctx.mode === "regret_check" && primary) {
    labels.push(trustBadge("ai_prediction"));
    reason = "Prediction only — may conflict with stated preferences.";
  }

  return { primary, secondary, movies: marathon, reason, labels, hasHistory };
}
