import "server-only";

import { runRecommendation } from "@/lib/ai/intelligence/recommendations";
import { getMovie } from "@/lib/tmdb/movies";
import { trustBadge } from "@/lib/ai/trust";

export type WatchlistAiAction =
  | "pick_one"
  | "similar"
  | "dedupe"
  | "complete_franchise"
  | "sort_rating"
  | "sort_runtime"
  | "build_movie_night";

export async function runWatchlistAi(action: WatchlistAiAction, movieIds: number[], userTasteIds: number[] = []) {
  const unique = [...new Set(movieIds)];
  const labels = [trustBadge("metadata"), trustBadge("ai_prediction")];

  if (action === "dedupe") {
    return {
      action,
      removed: movieIds.length - unique.length,
      movieIds: unique,
      explanation: "Removed duplicate catalog IDs from the list.",
      labels,
    };
  }

  if (action === "pick_one") {
    const rec = await runRecommendation({
      mode: "instant",
      watchlist: unique,
      favorites: unique.slice(0, 5),
      history: userTasteIds,
    });
    return {
      action,
      pick: rec.primary,
      reason: rec.reason,
      labels: [...rec.labels, ...labels],
    };
  }

  if (action === "similar") {
    const rec = await runRecommendation({
      mode: "taste_expansion",
      watchlist: unique,
      favorites: unique.slice(0, 5),
      history: unique,
    });
    return {
      action,
      movies: rec.movies.slice(0, 5),
      reason: rec.reason,
      labels: [...rec.labels, ...labels],
    };
  }

  if (action === "sort_rating" || action === "sort_runtime") {
    const movies = await Promise.all(unique.map((id) => getMovie(id).catch(() => null)));
    const valid = movies.filter(Boolean);
    const sorted = [...valid].sort((a, b) => {
      if (action === "sort_rating") return (b!.voteAverage ?? 0) - (a!.voteAverage ?? 0);
      return (a!.runtime ?? 999) - (b!.runtime ?? 999);
    });
    return {
      action,
      movieIds: sorted.map((m) => m!.id),
      explanation: action === "sort_rating" ? "Sorted by TMDB rating (verified metadata)." : "Sorted by runtime ascending.",
      labels: [trustBadge("metadata")],
    };
  }

  if (action === "build_movie_night") {
    const movies = await Promise.all(unique.slice(0, 12).map((id) => getMovie(id).catch(() => null)));
    const valid = movies.filter((m) => m && (m.runtime ?? 0) <= 150);
    const totalRuntime = valid.reduce((s, m) => s + (m!.runtime ?? 120), 0);
    const picks = valid.slice(0, totalRuntime > 240 ? 1 : 2);
    return {
      action,
      movies: picks,
      totalRuntime,
      explanation: `Movie night plan from list runtimes — ${picks.length} film(s), ~${totalRuntime} minutes.`,
      labels,
    };
  }

  if (action === "complete_franchise") {
    const rec = await runRecommendation({
      mode: "taste_expansion",
      watchlist: unique,
      favorites: unique,
      history: unique,
    });
    return {
      action,
      movies: rec.movies.filter((m) => !unique.includes(m.id)).slice(0, 5),
      reason: rec.reason ?? "Related franchise entries from catalog collections.",
      labels: [...rec.labels, ...labels],
    };
  }

  throw new Error("Unknown watchlist AI action.");
}
