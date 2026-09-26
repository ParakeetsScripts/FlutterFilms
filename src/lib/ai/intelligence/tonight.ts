import "server-only";

import { hasKnownRuntime, meetsRuntimeConstraint } from "@/lib/movies/eligibility";
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
  matched: string[];
  notUsed: string[];
  runtime?: number | null;
  genres: string[];
  ratings: { tmdb?: number | null; imdb?: string | null };
  watchProviders: string[];
  labels: ReturnType<typeof trustBadge>[];
};

const MOOD_LABELS: Record<TonightInput["mood"], string> = {
  low: "low energy",
  balanced: "balanced mood",
  high: "high energy",
};

const ATTENTION_LABELS: Record<TonightInput["attention"], string> = {
  background: "background viewing",
  full: "full attention",
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
  const hasHistory = ctx.history.length > 0;

  const result = await runRecommendation({
    mode,
    watchlist: ctx.watchlist,
    favorites: ctx.favorites,
    history: ctx.history,
    maxRuntime: input.minutes,
    energy,
    brain,
    language: input.language,
    genreIds: input.genreIds,
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
  const runtime = detail?.runtime ?? null;

  const becauseYouChose: string[] = [
    `≤ ${input.minutes} min available`,
    MOOD_LABELS[input.mood],
    ATTENTION_LABELS[input.attention],
    input.familiarity === "different" ? "something different" : "familiar picks",
  ];
  if (input.language) becauseYouChose.push(`language: ${input.language}`);
  if (input.genreIds?.length) becauseYouChose.push(`genre filter applied`);

  const matched: string[] = ["released (not a future title)"];
  if (hasKnownRuntime(runtime)) {
    if (meetsRuntimeConstraint(runtime, input.minutes)) {
      matched.push(`${runtime} min runtime`);
    } else {
      matched.push(`runtime ${runtime} min (exceeds your ${input.minutes} min limit)`);
    }
  } else if (input.minutes) {
    matched.push("runtime unknown — verify on title page");
  }
  if (detail?.genres?.length) matched.push(detail.genres.map((g) => g.name).join(", "));
  if (result.reason) matched.push(result.reason);

  const notUsed: string[] = [];
  if (!hasHistory) notUsed.push("watch history unavailable");
  if (!providers?.streaming?.length && !providers?.rent?.length && !providers?.buy?.length) {
    notUsed.push("provider availability not confirmed for your region");
  }

  const explanation = [
    `Because you chose: ${becauseYouChose.join(" · ")}`,
    ...buildRecommendationExplanation(tasteSignals).slice(0, 2),
  ];
  if (notUsed.length) explanation.push(`Not verified: ${notUsed.join("; ")}`);

  const watchNames = [
    ...(providers?.streaming ?? []).map((p) => p.name),
    ...(providers?.rent ?? []).map((p) => p.name),
    ...(providers?.buy ?? []).map((p) => p.name),
  ].slice(0, 5);

  return {
    primary,
    alternates,
    explanation: explanation.slice(0, 6),
    matched: matched.slice(0, 6),
    notUsed,
    runtime,
    genres: detail?.genres?.map((g) => g.name) ?? primary.genres?.map((g) => g.name) ?? [],
    ratings: {
      tmdb: detail?.tmdbRating ?? detail?.voteAverage ?? primary.voteAverage,
      imdb: detail?.imdbRating != null ? String(detail.imdbRating) : null,
    },
    watchProviders: watchNames.length ? watchNames : ["No verified providers for your region"],
    labels: [trustBadge("metadata"), trustBadge("user"), trustBadge("ai_prediction")],
  };
}
