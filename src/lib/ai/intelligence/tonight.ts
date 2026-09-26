import "server-only";

import { buildRecommendationExplanation } from "../explain";
import { runRecommendation } from "./recommendations";
import { getMovie } from "@/lib/tmdb/movies";
import { getWatchProviders } from "@/lib/tmdb/watch-providers";
import { trustBadge } from "../trust";
import type { TasteSignal } from "@/lib/user/taste-repository";
import type { MovieSummary } from "@/lib/tmdb/types";

export type TonightInput = {
  minutes: number;
  mood: "low" | "balanced" | "high";
  attention: "background" | "full";
  familiarity: "familiar" | "different";
  language?: string;
  genreIds?: number[];
  contentRating?: string;
};

export type TonightPick = {
  primary: MovieSummary;
  alternates: MovieSummary[];
  explanation: string[];
  runtime?: number | null;
  genres: string[];
  ratings: { tmdb?: number | null; imdb?: string | null };
  watchProviders: string[];
  labels: ReturnType<typeof trustBadge>[];
};

export async function buildTonightPick(
  input: TonightInput,
  ctx: { watchlist: number[]; favorites: number[]; history: number[] },
  tasteSignals: TasteSignal[] = [],
  region = "US",
): Promise<TonightPick | null> {
  const mode = input.familiarity === "different" ? "anti_algorithm" : "instant";
  const energy = input.mood;
  const brain = input.attention === "full" ? "thoughtful" : "casual";

  const result = await runRecommendation({
    mode,
    watchlist: ctx.watchlist,
    favorites: ctx.favorites,
    history: ctx.history,
    maxRuntime: input.minutes,
    energy,
    brain,
  });

  if (!result.primary) return null;

  const pool = [result.primary, result.secondary, ...result.movies].filter(Boolean) as MovieSummary[];
  const unique: MovieSummary[] = [];
  const seen = new Set<number>();
  for (const m of pool) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    unique.push(m);
  }

  const primary = unique[0];
  const alternates = unique.slice(1, 3);
  const detail = await getMovie(primary.id);
  const providers = await getWatchProviders(primary.id, region);

  const explanation = buildRecommendationExplanation(tasteSignals);
  if (result.reason) explanation.unshift(result.reason);
  if (input.minutes) explanation.push(`Target runtime ≤ ${input.minutes} minutes — verify on title page.`);
  if (input.familiarity === "different") explanation.push("Picked outside your recent history for variety.");

  const watchNames = [
    ...(providers?.streaming ?? []).map((p) => p.name),
    ...(providers?.rent ?? []).map((p) => p.name),
    ...(providers?.buy ?? []).map((p) => p.name),
  ].slice(0, 5);

  return {
    primary,
    alternates,
    explanation: explanation.slice(0, 6),
    runtime: detail?.runtime ?? null,
    genres: detail?.genres?.map((g) => g.name) ?? primary.genres?.map((g) => g.name) ?? [],
    ratings: {
      tmdb: detail?.tmdbRating ?? detail?.voteAverage ?? primary.voteAverage,
      imdb: detail?.imdbRating != null ? String(detail.imdbRating) : null,
    },
    watchProviders: watchNames.length ? watchNames : ["No verified providers for your region"],
    labels: [trustBadge("metadata"), trustBadge("user"), trustBadge("ai_prediction")],
  };
}
