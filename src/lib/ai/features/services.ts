import "server-only";

import { buildMovieBriefing } from "../intelligence/briefing";
import { buildCreativeAsset } from "../intelligence/creative";
import { buildInterviewProfile } from "../intelligence/interview";
import { analyzePerson, findSimilarPeople } from "../intelligence/people";
import { runRecommendation, type RecommendMode } from "../intelligence/recommendations";
import { semanticSearch } from "../intelligence/semantic-search";
import { groupPick, tasteIntersection, tasteMatchPercent } from "../intelligence/social";
import { runCinemaAgent } from "../agent/orchestrator";
import {
  buildMovieDnaProfile,
  buildPersonalityCard,
  buildRewatchSignals,
  buildTasteEvolutionTimeline,
  buildTasteExplanations,
  computeTasteDna,
  rewatchCandidates,
  tasteContradictions,
} from "../intelligence/taste";
import { savePostReflection, saveTasteSnapshot } from "@/lib/user/taste-repository";
import { analyzeFranchise, compareFranchises, findSpinOffs } from "../intelligence/franchise";
import { buildWeeklyBrief } from "../intelligence/weekly-brief";
import { searchSceneMemory } from "../intelligence/scene-memory";
import { getMovieLocations } from "../intelligence/locations";
import { getRoomByCode } from "@/lib/social/rooms";
import { getSharedWatchlist } from "@/lib/social/watchlists";
import { vibeSearch } from "../intelligence/vibe-search";
import { trustBadge } from "../trust";
import { tryExecuteExtendedFeature } from "./extended-services";
import { tryExecutePlannedFeature } from "./planned-services";
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
  const userId = ctx.userId ?? null;

  try {
    if (def.slug === "emotion-timeline") {
      const query = String(input.query ?? "emotional journey");
      const result = await vibeSearch(query);
      return {
        featureId: def.id,
        slug: def.slug,
        status: result.results?.length ? "success" : "insufficient_data",
        data: { ...result, timeline: result.results?.slice(0, 8).map((m, i) => ({ act: i + 1, title: m.title })) },
        labels: result.labels ?? [trustBadge("metadata"), trustBadge("ai_interpretation")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "micro-genre") {
      const query = String(input.query ?? "neo-noir");
      const result = await vibeSearch(query);
      return {
        featureId: def.id,
        slug: def.slug,
        status: result.results?.length ? "success" : "insufficient_data",
        data: { microGenre: query, picks: result.results?.slice(0, 10) },
        labels: result.labels ?? [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "franchise-catchup") {
      const collectionId = Number(input.collectionId);
      if (!collectionId) return insufficient(def, "Provide collectionId.");
      const analysis = await analyzeFranchise(collectionId, history);
      const remaining = analysis.unwatched?.slice(0, 5) ?? [];
      return {
        featureId: def.id,
        slug: def.slug,
        status: analysis.chronological?.length ? "success" : "insufficient_data",
        data: { franchise: analysis.name, catchUp: remaining, completionPercent: analysis.completionPercent },
        labels: [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "actor-chemistry") {
      const personId = Number(input.personId);
      if (!personId) return insufficient(def, "Provide personId.");
      const profile = await analyzePerson(personId);
      return {
        featureId: def.id,
        slug: def.slug,
        status: profile.frequentCoStars?.length ? "success" : "insufficient_data",
        data: { coStars: profile.frequentCoStars, note: "Chemistry inferred from shared top-billed credits — not performance analysis." },
        labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "watch-order") {
      const collectionId = Number(input.collectionId);
      if (!collectionId) return insufficient(def, "Provide collectionId.");
      const analysis = await analyzeFranchise(collectionId, history);
      return {
        featureId: def.id,
        slug: def.slug,
        status: analysis.chronological?.length ? "success" : "insufficient_data",
        data: {
          releaseOrder: analysis.releaseOrder,
          chronological: analysis.chronological,
          note: analysis.watchOrderNote,
        },
        labels: [trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

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
      try {
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
      } catch {
        return insufficient(def, "Room not found.");
      }
    }

    if (def.slug === "shared-watchlists") {
      const watchlistId = String(input.watchlistId ?? "");
      if (!userId) return unavailable(def, "Sign in required for this feature.");
      if (!watchlistId) return insufficient(def, "Provide a watchlist ID.");
      try {
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
      } catch {
        return insufficient(def, "Watchlist not found or access denied.");
      }
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

    if (
      def.slug === "taste-dna-2" ||
      def.slug === "personality-card" ||
      def.slug === "movie-dna" ||
      def.slug === "genre-map" ||
      def.slug === "decade-map" ||
      def.slug === "global-cinema-map" ||
      def.slug === "favorite-patterns" ||
      def.slug === "taste-contradiction" ||
      def.slug === "rewatch-probability"
    ) {
      const ids = (input.movieIds as number[]) ?? [...favorites, ...history, ...watchlist];
      if (!ids.length) return insufficient(def, "Add favorites or watch history first.");
      const dna = await computeTasteDna(ids);
      if (def.slug === "personality-card") {
        return {
          featureId: def.id,
          slug: def.slug,
          status: "success",
          data: { dna, personality: buildPersonalityCard(dna) },
          labels: [trustBadge("user"), trustBadge("metadata")],
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "genre-map") {
        return {
          featureId: def.id,
          slug: def.slug,
          status: "success",
          data: { genres: dna.genres, unexplored: dna.unexploredGenres },
          explanation: buildTasteExplanations(dna, favorites.length).slice(0, 3),
          labels: dna.labels,
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "decade-map") {
        return {
          featureId: def.id,
          slug: def.slug,
          status: "success",
          data: { decades: dna.decades },
          labels: dna.labels,
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "global-cinema-map") {
        return {
          featureId: def.id,
          slug: def.slug,
          status: "success",
          data: { countries: dna.countries, languages: dna.languages },
          labels: dna.labels,
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "favorite-patterns") {
        return {
          featureId: def.id,
          slug: def.slug,
          status: "success",
          data: { dna, patterns: buildTasteExplanations(dna, favorites.length) },
          labels: dna.labels,
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "taste-contradiction") {
        const contradictions = tasteContradictions(dna);
        return {
          featureId: def.id,
          slug: def.slug,
          status: contradictions.length ? "success" : "insufficient_data",
          data: { contradictions, dna },
          labels: [trustBadge("user"), trustBadge("ai_interpretation")],
          explanation: contradictions.length ? contradictions : ["Not enough genre diversity to detect contradictions yet."],
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "rewatch-probability") {
        const signals = buildRewatchSignals(history, favorites);
        const candidates = rewatchCandidates(history, favorites);
        return {
          featureId: def.id,
          slug: def.slug,
          status: signals.length ? "success" : "insufficient_data",
          data: { signals, candidateIds: candidates, dna, methodology: "Ordinal signals from history+favorites overlap — not a calibrated probability." },
          explanation: signals.length
            ? signals.slice(0, 3).map((s) => `Movie ${s.movieId}: ${s.level} rewatch signal — ${s.reasons.join(" ")}`)
            : ["No watch history yet."],
          labels: [trustBadge("user")],
          ranAt: new Date().toISOString(),
        };
      }
      if (def.slug === "movie-dna") {
        const movieId = Number(input.movieId);
        if (movieId) {
          const profile = await buildMovieDnaProfile(movieId);
          return {
            featureId: def.id,
            slug: def.slug,
            status: profile ? "success" : "insufficient_data",
            data: { profile, userDna: dna },
            labels: [trustBadge("metadata"), trustBadge("user")],
            ranAt: new Date().toISOString(),
          };
        }
      }
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: dna,
        labels: [trustBadge("user"), trustBadge("metadata")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "franchise-completion") {
      const collectionId = Number(input.collectionId);
      if (!collectionId) return insufficient(def, "Select a franchise (collection ID).");
      const analysis = await analyzeFranchise(collectionId, history);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: analysis,
        explanation: [
          `You've watched ${analysis.watchedCount} of ${analysis.movieCount} entries (${analysis.completionPercent}%).`,
          analysis.entryRecommendation
            ? `Next suggested: ${analysis.entryRecommendation.title}`
            : "No unwatched entries in this collection.",
        ],
        labels: analysis.labels,
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "taste-evolution") {
      if (userId) {
        const timeline = await buildTasteEvolutionTimeline(userId);
        if (timeline.status === "success") {
          return {
            featureId: def.id,
            slug: def.slug,
            status: "success",
            data: timeline,
            labels: timeline.labels ?? [trustBadge("user")],
            ranAt: new Date().toISOString(),
          };
        }
      }
      if (history.length < 3) {
        return insufficient(def, "Taste evolution is still building — watch more films or save taste snapshots.");
      }
      const dna = await computeTasteDna([...favorites, ...history]);
      if (userId) await saveTasteSnapshot(userId, dna as unknown as Record<string, unknown>);
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: {
          note: "Current taste snapshot saved — historical timeline will grow with future snapshots.",
          current: dna,
          historyDepth: history.length,
        },
        labels: [trustBadge("user"), trustBadge("ai_interpretation")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "post-reflection") {
      const movieId = Number(input.movieId);
      if (!movieId) return insufficient(def, "Select a movie you watched.");
      const briefing = await buildMovieBriefing(movieId, "light");
      const prompts = [
        "What moment stayed with you after the credits?",
        "Which character choice surprised you most?",
        "How did the ending change your reading of the opening?",
      ];
      const reflection = input.reflection as Record<string, unknown> | undefined;
      let saved = false;
      if (reflection && userId) {
        try {
          await savePostReflection(userId, movieId, {
            liked: reflection.liked ? String(reflection.liked) : undefined,
            disliked: reflection.disliked ? String(reflection.disliked) : undefined,
            rating: reflection.rating != null ? Number(reflection.rating) : undefined,
            mood: reflection.mood ? String(reflection.mood) : undefined,
            wouldRewatch: Boolean(reflection.wouldRewatch),
            wouldRecommend: Boolean(reflection.wouldRecommend),
            favoriteElement: reflection.favoriteElement ? String(reflection.favoriteElement) : undefined,
          });
          saved = true;
        } catch {
          saved = false;
        }
      }
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: {
          prompts,
          movieId: briefing?.movieId,
          movieTitle: briefing?.movieTitle,
          sections: briefing?.sections?.slice(0, 2),
          saved,
        },
        labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
        explanation: [
          saved
            ? "Reflection saved to taste signals."
            : "Submit reflection responses to persist them to your taste profile.",
        ],
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
      const movieId = Number(input.movieId ?? favorites[0] ?? history[0]);
      if (!movieId) return insufficient(def, "Select a movie for context.");
      const spoilerLevel =
        def.slug === "ending-explanation" ? "moderate" : def.slug === "spoiler-shield" ? "none" : "light";
      const briefing = await buildMovieBriefing(movieId, spoilerLevel);
      const prompts: Record<string, string[]> = {
        "debate-mode": ["Which character decision is most defensible?", "Is the ending earned or convenient?"],
        "discussion-starter": ["What theme would you argue is central?", "Who changed the most by the final scene?"],
        "food-pairing": ["Pair with comfort food for a cozy watch.", "Match cuisine to the film's primary setting if known."],
        "atmosphere-mode": ["Dim lights, phone away — match runtime to your energy.", "Consider soundtrack listening after credits."],
      };
      return {
        featureId: def.id,
        slug: def.slug,
        status: briefing ? "success" : "insufficient_data",
        data: {
          briefing,
          prompts: prompts[def.slug] ?? ["Explore this title in Copilot for a generative deep dive."],
          copilotPath: "/copilot",
          note: "Metadata briefing included — connect a chat model in Copilot for generative expansion.",
        },
        labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
        ranAt: new Date().toISOString(),
      };
    }

    if (def.slug === "cinema-agent") {
      const message = String(input.message ?? input.query ?? "Help me discover a movie.");
      const agent = await runCinemaAgent({
        message,
        userId,
        watchlist,
        favorites,
        history,
        sessionContext: (input.sessionContext as import("../agent/session-context").AgentSessionContext) ?? {},
      });
      return {
        featureId: def.id,
        slug: def.slug,
        status: "success",
        data: {
          tools: agent.tools,
          evidence: agent.evidence,
          actions: agent.actions,
          sessionContext: agent.sessionContext,
          copilotPath: "/copilot",
        },
        labels: [trustBadge("metadata"), trustBadge("user")],
        explanation: [
          ...agent.sources,
          "Generative natural-language reply continues in Copilot when a model is connected.",
        ],
        ranAt: new Date().toISOString(),
      };
    }

    const planned = await tryExecutePlannedFeature(def, input, {
      userId,
      watchlist,
      favorites,
      history,
    });
    if (planned) return planned;

    const extended = await tryExecuteExtendedFeature(def, input, {
      userId,
      watchlist,
      favorites,
      history,
    });
    if (extended) return extended;

    return unavailable(def, "This capability is not implemented yet.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feature execution failed.";
    const degraded = /temporarily unavailable|TMDB|catalog|database/i.test(message);
    return {
      featureId: def.id,
      slug: def.slug,
      status: degraded ? "insufficient_data" : "error",
      labels: [trustBadge("metadata")],
      error: message,
      ranAt: new Date().toISOString(),
    };
  }
}
