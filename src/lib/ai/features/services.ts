import "server-only";

import { buildMovieBriefing } from "../intelligence/briefing";
import { buildCreativeAsset } from "../intelligence/creative";
import { analyzeFranchise } from "../intelligence/franchise";
import { buildInterviewProfile } from "../intelligence/interview";
import { analyzePerson, findSimilarPeople } from "../intelligence/people";
import { runRecommendation, type RecommendMode } from "../intelligence/recommendations";
import { semanticSearch } from "../intelligence/semantic-search";
import { groupPick, tasteIntersection, tasteMatchPercent } from "../intelligence/social";
import { computeTasteDna } from "../intelligence/taste";
import { buildWeeklyBrief } from "../intelligence/weekly-brief";
import { searchSceneMemory } from "../intelligence/scene-memory";
import { getMovieLocations } from "../intelligence/locations";
import { compareFranchises, findSpinOffs } from "../intelligence/franchise";
import { getRoomByCode } from "@/lib/social/rooms";
import { getSharedWatchlist } from "@/lib/social/watchlists";
import { vibeSearch } from "../intelligence/vibe-search";
import { trustBadge } from "../trust";
import type { FeatureDefinition, FeatureRunInput, FeatureRunResult } from "./types";

export type FeatureContext = {
  userId?: string | null;
  watchlist?: number[];
  favorites?: number[];
  history?: number[];
};

const RECOMMEND_SLUGS: Record<string, RecommendMode> = {
  "background-mode": "background",
  "no-skip-mode": "no_skip",
  "instant-pick": "instant",
  "movie-roulette": "roulette",
  "anti-algorithm": "anti_algorithm",
  "taste-expansion": "taste_expansion",
  "context-aware": "comfort",
  "energy-slider": "comfort",
  "brain-level": "challenge",
  "attention-requirement": "background",
  "regret-predictor": "regret_check",
  "session-planner": "weekend_marathon",
  "double-feature": "double_feature",
  "weekend-marathon": "weekend_marathon",
  "family-planner": "family",
  "short-on-time": "short_time",
};

const BRIEFING_SLUGS = new Set([
  "movie-briefing",
  "first-time-guide",
  "character-primer",
  "world-primer",
  "theme-explorer",
  "motif-explorer",
  "symbolism-mode",
  "filmmaking-breakdown",
]);

const CREATIVE_SLUGS: Record<string, import("../intelligence/creative").CreativeKind> = {
  "poster-generator": "poster",
  "watchlist-poster": "watchlist_poster",
  "movie-night-card": "movie_night_card",
  "franchise-graphic": "franchise_timeline",
  "comparison-graphic": "comparison",
  "trailer-concept": "trailer_concept",
  "review-assistant": "review_outline",
};

function unavailable(def: FeatureDefinition, reason: string): FeatureRunResult {
  return {
    featureId: def.id,
    slug: def.slug,
    status: "unavailable",
    labels: [trustBadge("metadata")],
    error: reason,
    ranAt: new Date().toISOString(),
  };
}

function insufficient(def: FeatureDefinition, reason = "Not enough verified data"): FeatureRunResult {
  return {
    featureId: def.id,
    slug: def.slug,
    status: "insufficient_data",
    labels: [trustBadge("metadata")],
    error: reason,
    ranAt: new Date().toISOString(),
  };
}

export async function executeFeatureService(
  def: FeatureDefinition,
  input: FeatureRunInput,
  ctx: FeatureContext,
): Promise<FeatureRunResult> {
  if (!def.hasService) {
    return unavailable(def, "This capability is not implemented yet.");
  }

  if (def.requiresAuth && !ctx.userId) {
    return unavailable(def, "Sign in required for this feature.");
  }

  const watchlist = ctx.watchlist ?? [];
  const favorites = ctx.favorites ?? [];
  const history = ctx.history ?? [];

  try {
    if (def.slug === "vibe-search" || def.slug === "nl-filters") {
      const query = String(input.query ?? "");
      if (!query.trim()) return insufficient(def, "Enter a search query.");
      const result = await vibeSearch(query);
      return {
        featureId: def.id,
        slug: def.slug,
        status: result.results?.length ? "success" : "insufficient_data",
        data: result,
        labels: result.labels ?? [trustBadge("metadata")],
        explanation: result.interpretation ? [result.interpretation] : undefined,
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "scene-memory" || def.slug === "remember-wizard") {
      const parts = (input.parts as string[]) ?? [String(input.query ?? input.description ?? "")];
      const result = await searchSceneMemory(parts.filter(Boolean));
      return {
        featureId: def.id,
        slug: def.slug,
        status: result.results?.length ? "success" : "insufficient_data",
        data: result,
        labels: result.labels,
        explanation: [result.hint],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "location-intelligence") {
      const movieId = Number(input.movieId);
      if (!movieId) return insufficient(def, "Select a movie.");
      const locations = await getMovieLocations(movieId);
      if (!locations?.locations.length) return insufficient(def);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: locations,
        labels: locations.labels,
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "franchise-similarity") {
      const a = Number(input.collectionIdA);
      const b = Number(input.collectionIdB);
      if (!a || !b) return insufficient(def, "Two franchise IDs required.");
      const data = await compareFranchises(a, b);
      return { featureId: def.id, slug: def.slug, status: "success", data, labels: data.labels, ranAt: new Date().toISOString() };
    }

    if (def.slug === "spin-off-discovery") {
      const collectionId = Number(input.collectionId);
      if (!collectionId) return insufficient(def, "Select a franchise.");
      const data = await findSpinOffs(collectionId);
      return { featureId: def.id, slug: def.slug, status: "success", data, labels: data.labels, ranAt: new Date().toISOString() };
    }

    if (def.slug === "movie-room") {
      const code = String(input.code ?? "");
      if (!code) return insufficient(def, "Room code required.");
      const room = await getRoomByCode(code);
      if (!room) return insufficient(def, "Room not found.");
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: room,
        labels: [trustBadge("user")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "shared-watchlists") {
      const watchlistId = String(input.watchlistId ?? "");
      const userId = ctx.userId;
      if (!userId || !watchlistId) return unavailable(def, "Sign in and provide watchlist ID.");
      const list = await getSharedWatchlist(watchlistId, userId);
      if (!list) return insufficient(def, "Watchlist not found or access denied.");
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: list,
        labels: [trustBadge("user")],
        ranAt: new Date().toISOString(),
      };
    }

    if (
      def.slug === "visual-description" ||
      def.slug === "semantic-catalog" ||
      def.slug === "narrative-structure" ||
      def.slug === "pacing-search" ||
      def.slug === "character-arc" ||
      def.slug === "relationship-search"
    ) {
      const query = String(input.query ?? input.description ?? "");
      if (!query.trim()) return insufficient(def, "Describe what you remember.");
      const mode =
        def.slug === "visual-description"
          ? "visual"
          : def.slug === "narrative-structure"
            ? "structure"
            : def.slug === "pacing-search"
              ? "pacing"
              : def.slug === "character-arc"
                ? "arc"
                : def.slug === "relationship-search"
                  ? "relationship"
                  : "general";
      const result = await semanticSearch(query, mode);
      return {
        featureId: def.id,
        slug: def.slug,
        status: result.results?.length ? "success" : "insufficient_data",
        data: result,
        labels: result.labels ?? [trustBadge("metadata")],
        explanation: [result.hint],
        ranAt: new Date().toISOString(),
      };
    }

    const recommendMode = RECOMMEND_SLUGS[def.slug];
    if (recommendMode) {
      const result = await runRecommendation({
        mode: recommendMode,
        watchlist,
        favorites,
        history,
        maxRuntime: input.maxRuntime ? Number(input.maxRuntime) : undefined,
        energy: input.energy as "low" | "balanced" | "high" | undefined,
        brain: input.brain as "casual" | "thoughtful" | "complex" | "extreme" | undefined,
        hourOfDay: input.hourOfDay ? Number(input.hourOfDay) : undefined,
      });
      if (!result.primary && !result.movies?.length) {
        return insufficient(def);
      }
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: result,
        labels: result.labels ?? [trustBadge("metadata"), trustBadge("ai_prediction")],
        explanation: result.reason ? [result.reason] : undefined,
        ranAt: new Date().toISOString(),
      };
    }

    if (BRIEFING_SLUGS.has(def.slug)) {
      const movieId = Number(input.movieId);
      if (!movieId) return insufficient(def, "Select a movie.");
      const spoilerLevel = (input.spoilerLevel as "none" | "light" | "moderate" | "full") ?? "none";
      const briefing = await buildMovieBriefing(movieId, spoilerLevel);
      if (!briefing?.sections?.length) return insufficient(def);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: briefing,
        labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "movie-interview") {
      const answers = (input.answers as Record<string, string>) ?? {};
      const profile = buildInterviewProfile(answers);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: profile,
        labels: [trustBadge("user"), trustBadge("ai_interpretation")],
        explanation: ["Interview answers converted to structured taste signals."],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "taste-dna-2" || def.slug === "personality-card") {
      const ids = (input.movieIds as number[]) ?? [...favorites, ...history];
      if (!ids.length) return insufficient(def, "Add favorites or watch history first.");
      const dna = await computeTasteDna(ids);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: dna,
        labels: [trustBadge("user"), trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "weekly-brief" || def.slug === "cinema-newsletter") {
      const brief = await buildWeeklyBrief();
      return {
        featureId: def.id,
        slug: def.slug,
        status: brief.sections?.length ? "success" : "insufficient_data",
        data: brief,
        labels: brief.labels ?? [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "group-picker") {
      const profiles = (input.profiles as Array<{ label: string; movieIds: number[] }>) ?? [];
      if (profiles.length < 2) return insufficient(def, "Add at least two taste profiles.");
      const pick = await groupPick(profiles, history);
      return {
        featureId: def.id,
        slug: def.slug,
        status: pick.pick ? "success" : "insufficient_data",
        data: pick,
        labels: pick.labels ?? [trustBadge("user"), trustBadge("ai_prediction")],
        explanation: pick.reason ? [pick.reason] : undefined,
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "taste-intersection") {
      const profiles = (input.profiles as Array<{ label: string; movieIds: number[] }>) ?? [];
      if (profiles.length < 2) return insufficient(def, "Add at least two profiles.");
      const intersection = await tasteIntersection(profiles);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: intersection,
        labels: [trustBadge("user")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "taste-match") {
      const a = input.profileA as { label: string; movieIds: number[] };
      const b = input.profileB as { label: string; movieIds: number[] };
      if (!a || !b) return insufficient(def, "Two profiles required.");
      const match = await tasteMatchPercent(a, b);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: match,
        labels: [trustBadge("user"), trustBadge("ai_prediction")],
        explanation: match.explanation ? [match.explanation] : undefined,
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "timeline-conflicts") {
      const collectionId = Number(input.collectionId);
      if (!collectionId) return insufficient(def, "Select a franchise.");
      const analysis = await analyzeFranchise(collectionId, history);
      return {
        featureId: def.id,
        slug: def.slug,
        status: analysis.timelineConflicts?.length ? "success" : "insufficient_data",
        data: { conflicts: analysis.timelineConflicts, franchise: analysis.name },
        labels: [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "franchise-health" || def.slug === "franchise-entry") {
      const collectionId = Number(input.collectionId);
      if (!collectionId) return insufficient(def, "Select a franchise.");
      const analysis = await analyzeFranchise(collectionId, history);
      return {
        featureId: def.id,
        slug: def.slug,
        status: analysis.chronological?.length ? "success" : "insufficient_data",
        data: analysis,
        labels: [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "actor-similarity" || def.slug === "director-similarity") {
      const personId = Number(input.personId);
      if (!personId) return insufficient(def, "Select a person.");
      const kind = def.slug === "director-similarity" ? "director" : "actor";
      const similar = await findSimilarPeople(personId, kind);
      return {
        featureId: def.id,
        slug: def.slug,
        status: similar.similar?.length ? "success" : "insufficient_data",
        data: similar,
        labels: similar.labels ?? [trustBadge("metadata")],
        explanation: similar.reason ? [similar.reason] : undefined,
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "career-turning-points" || def.slug === "filmography-journey") {
      const personId = Number(input.personId);
      if (!personId) return insufficient(def, "Select a person.");
      const analysis = await analyzePerson(personId);
      return {
        featureId: def.id,
        slug: def.slug,
        status: analysis.filmographyJourney?.length ? "success" : "insufficient_data",
        data: analysis,
        labels: [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    const creativeKind = CREATIVE_SLUGS[def.slug];
    if (creativeKind) {
      const title = String(input.title ?? "Untitled");
      const asset = buildCreativeAsset(creativeKind, {
        title,
        subtitle: input.subtitle ? String(input.subtitle) : undefined,
        items: input.items as Array<{ label: string; value: string }>,
        movies: input.movies as Array<{ title: string; year?: number | null }>,
      });
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: asset,
        labels: asset.labels ?? [trustBadge("ai_interpretation")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "smart-resume") {
      const progress = input.progress as { movieId: number; percent: number } | undefined;
      if (!progress?.movieId) return insufficient(def, "No authorized playback progress found.");
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: progress,
        labels: [trustBadge("user")],
        ranAt: new Date().toISOString(),
      };
    }

    if (
      def.slug === "spoiler-shield" ||
      def.slug === "ending-explanation" ||
      def.slug === "debate-mode" ||
      def.slug === "discussion-starter" ||
      def.slug === "food-pairing" ||
      def.slug === "atmosphere-mode"
    ) {
      return unavailable(
        def,
        "Use AI Copilot with a connected chat model. Configure Ollama or a cloud provider in Open Models.",
      );
    }

    if (def.slug === "cinema-agent") {
      return unavailable(def, "Open /copilot to use the Cinema Agent with tool calling.");
    }

    return unavailable(def, "This capability is not implemented yet.");
  } catch (error) {
    return {
      featureId: def.id,
      slug: def.slug,
      status: "error",
      labels: [trustBadge("metadata")],
      error: error instanceof Error ? error.message : "Feature execution failed.",
      ranAt: new Date().toISOString(),
    };
  }
}
