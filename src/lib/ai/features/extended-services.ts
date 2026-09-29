import "server-only";

import { getMovieEvidence } from "../evidence";
import { analyzeFranchise } from "../intelligence/franchise";
import { analyzePerson, findSimilarPeople } from "../intelligence/people";
import { runRecommendation } from "../intelligence/recommendations";
import { groupPick } from "../intelligence/social";
import {
  buildRewatchSignals,
  buildTasteExplanations,
  computeTasteDna,
  rewatchCandidates,
} from "../intelligence/taste";
import { isDatabaseUserId } from "@/lib/user/ids";
import { getUserTasteContext } from "@/lib/user/taste-context";
import { getMovieRow } from "@/lib/sync/repository";
import { trustBadge } from "../trust";
import type { FeatureDefinition, FeatureRunInput, FeatureRunResult } from "./types";
import type { FeatureContext } from "./services";

const COMPARISON = new Set([
  "movie-vs-movie", "movie-similarity", "tone-similarity", "theme-similarity", "genre-similarity-compare",
  "runtime-similarity", "cast-similarity", "director-similarity-match", "crew-similarity", "era-similarity",
  "language-similarity", "country-similarity", "franchise-similarity-match", "audience-similarity",
]);

const LIKE_VARIANTS = new Set([
  "like-darker", "like-lighter", "like-shorter", "like-more-serious", "like-less-violent", "like-more-mainstream",
]);

const FRANCHISE_SLUGS = new Set([
  "franchise-map-visual", "franchise-timeline-ordered", "franchise-release-order", "franchise-chronological-order",
  "franchise-entry-point", "franchise-watch-order-planner", "franchise-similarity-engine", "franchise-spin-off-finder",
  "franchise-remake-tracker", "franchise-adaptation-tracker", "franchise-cast-timeline", "franchise-crew-timeline",
  "franchise-runtime-chart", "franchise-rating-trend", "franchise-genre-shift", "franchise-gap-finder",
  "franchise-missing-movies", "franchise-marathon-planner", "franchise-personal-plan", "franchise-completion-report",
  "franchise-similarity-match",
]);

const PEOPLE_SLUGS = new Set([
  "writer-similarity", "producer-similarity", "cinematographer-similarity", "editor-similarity", "composer-similarity",
  "actor-career-timeline", "director-career-timeline", "writer-career-timeline", "frequent-collaborators",
  "career-breakthrough-analysis", "filmography-explorer", "shared-cast-discovery", "shared-crew-discovery",
  "what-else-they-made", "people-discovery-taste", "people-discovery-filmography", "crew-role-explorer",
  "casting-pattern-finder", "director-style-signature", "performer-range-analysis",
]);

const TASTE_SLUGS = new Set([
  "favorite-actors-rank", "favorite-directors-rank", "favorite-writers-rank", "favorite-languages-rank",
  "favorite-countries-rank", "runtime-taste-preference", "rating-taste-preference", "rewatch-signal-analysis",
  "discovery-diversity-score", "familiarity-balance", "mainstream-niche-score", "taste-expansion-suggestions",
  "taste-blind-spot-finder", "taste-report",
]);

const RECOMMEND_SLUGS = new Set([
  "anti-regret-picker", "rewatch-picker", "discovery-challenge", "one-movie-commitment", "surprised-pick",
  "comfort-zone-pick", "more-like-favorites", "least-like-favorites", "triple-feature", "weekly-movie-plan",
  "couple-planner", "late-night-picker", "morning-movie-picker", "what-watch-next", "attention-session-planner",
  "watch-journey",
]);

const EXTENDED_SLUGS = new Set([
  ...COMPARISON,
  ...LIKE_VARIANTS,
  ...FRANCHISE_SLUGS,
  ...PEOPLE_SLUGS,
  ...TASTE_SLUGS,
  ...RECOMMEND_SLUGS,
  "why-this-movie", "why-not-this-movie", "tonight-picker", "watchlist-prioritizer", "watchlist-randomizer",
  "group-taste-merge", "room-consensus", "room-tie-breaker", "cinema-command-center", "cinema-agent-memory-hub",
]);

function ok(def: FeatureDefinition, data: unknown, labels = [trustBadge("metadata")]): FeatureRunResult {
  return { featureId: def.id, slug: def.slug, status: "success", data, labels, ranAt: new Date().toISOString() };
}

function need(def: FeatureDefinition, reason: string): FeatureRunResult {
  return {
    featureId: def.id,
    slug: def.slug,
    status: "insufficient_data",
    labels: [trustBadge("metadata")],
    error: reason,
    ranAt: new Date().toISOString(),
  };
}

async function compareMovies(movieIdA: number, movieIdB: number) {
  const [a, b] = await Promise.all([getMovieEvidence(movieIdA), getMovieEvidence(movieIdB)]);
  if (!a || !b) return null;
  return {
    a: {
      id: movieIdA,
      title: a.title,
      year: a.year,
      runtime: a.tmdb?.runtime ?? a.imdb?.runtime,
      genres: a.tmdb?.genres ?? [],
    },
    b: {
      id: movieIdB,
      title: b.title,
      year: b.year,
      runtime: b.tmdb?.runtime ?? b.imdb?.runtime,
      genres: b.tmdb?.genres ?? [],
    },
    labels: [trustBadge("metadata")],
  };
}

function recommendCtx(
  mode: import("../intelligence/recommendations").RecommendMode,
  ctx: FeatureContext,
  input: FeatureRunInput,
  watchlist: number[],
  favorites: number[],
  history: number[],
) {
  return {
    mode,
    watchlist,
    favorites,
    history,
    maxRuntime: input.maxRuntime ? Number(input.maxRuntime) : undefined,
    energy: input.energy as "low" | "balanced" | "high" | undefined,
    brain: input.brain as "casual" | "thoughtful" | "complex" | "extreme" | undefined,
  };
}

export async function tryExecuteExtendedFeature(
  def: FeatureDefinition,
  input: FeatureRunInput,
  ctx: FeatureContext,
): Promise<FeatureRunResult | null> {
  if (!EXTENDED_SLUGS.has(def.slug)) return null;

  const favorites = ctx.favorites ?? [];
  const history = ctx.history ?? [];
  const watchlist = ctx.watchlist ?? [];
  const movieId = Number(input.movieId ?? input.primaryMovieId ?? favorites[0] ?? history[0]);
  const movieIdB = Number(input.compareMovieId ?? input.secondaryMovieId ?? watchlist[0]);
  const personId = Number(input.personId);
  const collectionId = Number(input.collectionId);

  if (def.slug === "movie-vs-movie") {
    if (!movieId || !movieIdB) return need(def, "Provide movieId and compareMovieId.");
    const data = await compareMovies(movieId, movieIdB);
    return data ? ok(def, data) : need(def, "Movies not found in catalog.");
  }

  if (FRANCHISE_SLUGS.has(def.slug)) {
    if (!collectionId) return need(def, "Provide collectionId.");
    const analysis = await analyzeFranchise(collectionId, history);
    return analysis.chronological?.length ? ok(def, analysis) : need(def, "Franchise data unavailable.");
  }

  if (PEOPLE_SLUGS.has(def.slug)) {
    if (!personId) return need(def, "Provide personId.");
    if (def.slug.endsWith("-similarity")) {
      const similar = await findSimilarPeople(personId);
      return similar.similar?.length ? ok(def, similar) : need(def, "No similar people found.");
    }
    const profile = await analyzePerson(personId);
    return profile ? ok(def, profile) : need(def, "Person not found.");
  }

  if (TASTE_SLUGS.has(def.slug)) {
    if (!ctx.userId && !favorites.length) return need(def, "Sign in or add favorites for taste analysis.");
    const ids = [...new Set([...favorites, ...history])];
    const dna = ids.length ? await computeTasteDna(ids) : null;
    if (def.slug === "taste-report") {
      const taste = isDatabaseUserId(ctx.userId) ? await getUserTasteContext(ctx.userId!) : null;
      return ok(def, { dna, taste }, [trustBadge("user")]);
    }
    if (def.slug === "rewatch-signal-analysis") {
      const signals = buildRewatchSignals(favorites, history);
      const candidates = await rewatchCandidates(favorites, history);
      return ok(def, { signals, candidates }, [trustBadge("user")]);
    }
    return dna ? ok(def, dna, [trustBadge("user")]) : need(def, "Not enough taste data yet.");
  }

  if (RECOMMEND_SLUGS.has(def.slug)) {
    const modeMap: Record<string, string> = {
      "anti-regret-picker": "regret_check",
      "one-movie-commitment": "instant",
      "surprised-pick": "roulette",
      "comfort-zone-pick": "taste_expansion",
      "more-like-favorites": "comfort",
      "least-like-favorites": "anti_algorithm",
      "triple-feature": "weekend_marathon",
      "weekly-movie-plan": "weekend_marathon",
      "rewatch-picker": "no_skip",
      "discovery-challenge": "taste_expansion",
      "late-night-picker": "background",
      "morning-movie-picker": "short_time",
      "what-watch-next": "instant",
      "attention-session-planner": "background",
      "watch-journey": "weekend_marathon",
    };
    const mode = (modeMap[def.slug] ?? "instant") as import("../intelligence/recommendations").RecommendMode;
    const rec = await runRecommendation(recommendCtx(mode, ctx, input, watchlist, favorites, history));
    return rec.primary ? ok(def, rec, [trustBadge("metadata"), trustBadge("user")]) : need(def, "No recommendation available.");
  }

  if (def.slug === "why-this-movie" || def.slug === "why-not-this-movie") {
    if (!movieId) return need(def, "Provide movieId.");
    const ids = [...new Set([...favorites, ...history])];
    const dna = ids.length ? await computeTasteDna(ids) : null;
    const evidence = await getMovieEvidence(movieId);
    const explanations = dna ? buildTasteExplanations(dna, favorites.length) : ["Add favorites to personalize rationale."];
    return ok(def, { explanations, evidence, polarity: def.slug === "why-not-this-movie" ? "negative" : "positive" }, [
      trustBadge("metadata"),
      trustBadge("user"),
    ]);
  }

  if (def.slug === "couple-planner" || def.slug === "group-taste-merge") {
    const profiles = [
      { label: "You", movieIds: favorites },
      { label: "Partner", movieIds: (input.partnerMovieIds as number[]) ?? watchlist.slice(0, 10) },
    ];
    const pick = await groupPick(profiles, history);
    return pick.pick ? ok(def, pick) : need(def, "Add group members or taste signals.");
  }

  if (def.slug === "room-consensus" || def.slug === "room-tie-breaker") {
    return ok(def, {
      votes: [],
      consensus: null,
      sampleSize: 0,
      method: def.slug === "room-tie-breaker" ? "deterministic-hash" : "majority",
      limitations: ["No room votes in this session. Open /rooms to collect participant votes."],
    });
  }

  if (def.slug === "watchlist-prioritizer" || def.slug === "watchlist-randomizer") {
    if (!watchlist.length) return need(def, "Watchlist is empty.");
    if (def.slug === "watchlist-randomizer") {
      const pick = watchlist[Math.floor(Math.random() * watchlist.length)];
      const row = await getMovieRow(pick);
      return row ? ok(def, { movieId: pick, title: row.title }) : need(def, "Watchlist movie not in catalog.");
    }
    const dna = favorites.length ? await computeTasteDna(favorites) : null;
    return ok(def, { watchlist, tasteGenres: dna?.genres?.slice(0, 5) ?? [] });
  }

  if (def.slug === "tonight-picker") {
    const rec = await runRecommendation(recommendCtx("instant", ctx, input, watchlist, favorites, history));
    return rec.primary
      ? ok(
          def,
          {
            primary: rec.primary,
            movies: rec.movies,
            explanation: rec.reason,
            route: "/tonight",
            constraints: { watchlist, favorites, history },
          },
          [trustBadge("metadata"), trustBadge("user")],
        )
      : need(def, "Not enough catalog or taste signal for a tonight pick.");
  }

  if (def.slug === "cinema-command-center") {
    return ok(def, {
      featureCount: 200,
      categories: ["discovery", "movie", "people", "franchise", "personal", "social", "watching", "search", "creative", "agent"],
      results: [
        { slug: "taste-dna-2", title: "Taste DNA 2.0" },
        { slug: "tonight-picker", title: "Tonight Picker" },
        { slug: "movie-vs-movie", title: "Movie vs Movie" },
      ],
      route: "/intelligence",
    });
  }

  if (def.slug === "cinema-agent-memory-hub") {
    return ok(def, {
      memories: [],
      controls: ["view", "edit", "delete", "clear"],
      results: [],
      route: "/account/memories",
      requiresAuth: true,
      note: "Memory is user-controlled. Nothing is stored until you choose Remember this.",
    });
  }

  if (def.slug === "taste-expansion-suggestions" || def.slug === "taste-blind-spot-finder") {
    const dna = favorites.length ? await computeTasteDna(favorites) : null;
    return dna ? ok(def, { unexploredGenres: dna.unexploredGenres, genres: dna.genres }) : need(def, "Add favorites first.");
  }

  if (COMPARISON.has(def.slug) || LIKE_VARIANTS.has(def.slug)) {
    if (!movieId) return need(def, "Provide movieId.");
    const mode = def.slug.includes("shorter") ? "short_time" : def.slug.includes("darker") ? "challenge" : "comfort";
    const rec = await runRecommendation({
      ...recommendCtx(mode as import("../intelligence/recommendations").RecommendMode, ctx, input, watchlist, favorites, history),
      favorites: movieId ? [movieId, ...favorites] : favorites,
    });
    return rec.primary ? ok(def, rec, [trustBadge("metadata"), trustBadge("user")]) : need(def, "No similar candidates found.");
  }

  return need(def, "Provide required input for this feature.");
}
