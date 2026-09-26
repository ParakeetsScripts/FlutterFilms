import "server-only";

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
  mode: RecommendMode;
  maxRuntime?: number;
  energy?: "low" | "balanced" | "high";
  brain?: "casual" | "thoughtful" | "complex" | "extreme";
  hourOfDay?: number;
  excludeIds?: number[];
  groupTasteIds?: number[][];
};

function pick<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function dedupe(movies: MovieSummary[], exclude: Set<number>) {
  return movies.filter((m) => !exclude.has(m.id));
}

async function poolFromHistory(history: number[], favorites: number[]): Promise<MovieSummary[]> {
  const anchor = history[0] ?? favorites[0];
  if (!anchor) {
    const trending = await getTrendingMovies("day");
    return trending.results;
  }
  const recs = await getRecommendations(anchor).catch(() => ({ results: [] }));
  if (recs.results.length) return recs.results;
  const trending = await getTrendingMovies("day");
  return trending.results;
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
  const exclude = new Set([...ctx.history, ...(ctx.excludeIds ?? [])]);
  let movies: MovieSummary[] = [];
  let reason = "";
  const labels = [trustBadge("metadata")];

  if (ctx.mode === "short_time" && ctx.maxRuntime) {
    const discovered = await discoverMovies({ sort: "rating", ratingGte: 6 });
    movies = discovered.results.slice(0, 30);
    reason = `Short-on-time mode — verify runtime on each title (target ≤ ${ctx.maxRuntime} min).`;
  } else if (ctx.mode === "anti_algorithm") {
    const discovered = await discoverMovies({ sort: "release_date" });
    movies = dedupe(discovered.results, new Set(ctx.history));
    reason = "Intentionally outside your recent history.";
    labels.push(trustBadge("ai_interpretation"));
  } else if (ctx.mode === "taste_expansion") {
    const discovered = await discoverMovies({ sort: "rating", ratingGte: 7 });
    movies = dedupe(discovered.results, exclude).slice(0, 40);
    reason = "Higher-rated titles you have not viewed recently.";
  } else if (ctx.mode === "background") {
    const discovered = await discoverMovies(energyFilters("low"));
    movies = discovered.results;
    reason = "Comfortable, lower-attention picks from popularity signals.";
  } else if (ctx.mode === "roulette") {
    movies = await poolFromHistory(ctx.history, ctx.favorites);
    movies = dedupe(movies, exclude);
    reason = "Weighted random from taste-adjacent catalog recommendations.";
    labels.push(trustBadge("ai_prediction"));
  } else if (ctx.mode === "double_feature") {
    movies = await poolFromHistory(ctx.history, ctx.favorites);
    movies = dedupe(movies, exclude).slice(0, 12);
    reason = "Pairing from complementary recommendations — verify tone yourself.";
    labels.push(trustBadge("ai_interpretation"));
  } else if (ctx.mode === "weekend_marathon") {
    movies = await poolFromHistory(ctx.history, ctx.favorites);
    movies = dedupe(movies, exclude).slice(0, 8);
    reason = "Five-to-eight film marathon from your taste anchor.";
  } else {
    const filters = { ...energyFilters(ctx.energy), ...brainFilters(ctx.brain) };
    const [pool, discovered] = await Promise.all([
      poolFromHistory(ctx.history, ctx.favorites),
      discoverMovies(filters),
    ]);
    movies = dedupe([...pool, ...discovered.results], exclude);
    reason = ctx.mode === "instant" ? "Single best match from taste + discover." : `Mode: ${ctx.mode}`;
  }

  if (!movies.length) {
    const trending = await getTrendingMovies("day");
    movies = trending.results;
    reason = "Fallback to trending — personalize with watch history.";
  }

  const primary = pick(movies);
  const secondary =
    ctx.mode === "double_feature" ? pick(movies.filter((m) => m.id !== primary?.id)) : undefined;
  const marathon = ctx.mode === "weekend_marathon" ? movies.slice(0, 8) : movies.slice(0, 5);

  if (ctx.mode === "regret_check" && primary) {
    labels.push(trustBadge("ai_prediction"));
    reason = "Prediction only — may conflict with stated preferences.";
  }

  return { primary, secondary, movies: marathon, reason, labels };
}
