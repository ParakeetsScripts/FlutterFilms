import type { FeatureRunResult } from "./types";

/** Implementation honesty tier — drives LIVE vs BETA. */
export type ImplementationTier =
  | "distinct"
  | "family_differentiated"
  | "family_variant"
  | "generic_prompt"
  | "route_only"
  | "metadata_only";

const DISTINCT = new Set([
  "movie-interview",
  "vibe-search",
  "instant-pick",
  "movie-roulette",
  "anti-algorithm",
  "taste-expansion",
  "background-mode",
  "no-skip-mode",
  "energy-slider",
  "brain-level",
  "context-aware",
  "movie-briefing",
  "first-time-guide",
  "location-intelligence",
  "actor-similarity",
  "director-similarity",
  "franchise-completion",
  "franchise-health",
  "timeline-conflicts",
  "watch-order",
  "franchise-similarity",
  "spin-off-discovery",
  "taste-dna-2",
  "taste-contradiction",
  "favorite-patterns",
  "rewatch-probability",
  "taste-evolution",
  "personality-card",
  "genre-map",
  "decade-map",
  "global-cinema-map",
  "shared-watchlists",
  "movie-room",
  "group-picker",
  "taste-intersection",
  "taste-match",
  "double-feature",
  "weekend-marathon",
  "short-on-time",
  "post-reflection",
  "scene-memory",
  "remember-wizard",
  "nl-filters",
  "semantic-catalog",
  "cinema-agent",
  "movie-vs-movie",
  "version-comparison",
  "collaboration-graph",
  "crew-discovery",
  "crew-influence",
  "creative-team-dna",
  "universe-map",
  "adaptation-tracker",
  "remake-evolution",
  "franchise-catchup",
  "actor-chemistry",
  "smart-resume",
  "weekly-brief",
  "movie-dna",
]);

const FAMILY_DIFFERENTIATED = new Set([
  "franchise-entry",
  "franchise-gap-finder",
  "franchise-missing-movies",
  "franchise-marathon-planner",
  "franchise-personal-plan",
  "franchise-completion-report",
  "franchise-rating-trend",
  "franchise-runtime-chart",
  "franchise-genre-shift",
  "franchise-cast-timeline",
  "franchise-crew-timeline",
  "actor-career-timeline",
  "director-career-timeline",
  "writer-career-timeline",
  "career-breakthrough-analysis",
  "career-turning-points",
  "filmography-journey",
  "filmography-explorer",
  "frequent-collaborators",
  "shared-cast-discovery",
  "shared-crew-discovery",
  "rewatch-signal-analysis",
  "taste-report",
  "watchlist-prioritizer",
  "watchlist-randomizer",
  "rewatch-picker",
  "group-taste-merge",
]);

const GENERIC_PROMPT = new Set([
  "spoiler-shield",
  "ending-explanation",
  "debate-mode",
  "discussion-starter",
  "food-pairing",
  "atmosphere-mode",
  "director-intent",
  "production-challenges",
  "spoiler-rooms",
  "rewatch-reflection",
  "character-primer",
  "world-primer",
  "motif-explorer",
  "symbolism-mode",
  "filmmaking-breakdown",
  "theme-explorer",
  "emotion-timeline",
  "micro-genre",
]);

const ROUTE_ONLY = new Set(["tonight-picker", "cinema-command-center", "cinema-agent-memory-hub"]);

const METADATA_ONLY = new Set([
  "quote-search",
  "sentiment-map",
  "friend-recs",
  "room-consensus",
  "room-tie-breaker",
  "narrative-structure",
  "pacing-search",
  "character-arc",
  "relationship-search",
  "visual-description",
]);

export function implementationTierForSlug(slug: string): ImplementationTier {
  if (DISTINCT.has(slug)) return "distinct";
  if (FAMILY_DIFFERENTIATED.has(slug)) return "family_differentiated";
  if (ROUTE_ONLY.has(slug)) return "route_only";
  if (GENERIC_PROMPT.has(slug)) return "generic_prompt";
  if (METADATA_ONLY.has(slug)) return "metadata_only";
  if (
    slug.includes("similarity") ||
    slug.startsWith("like-") ||
    slug.endsWith("-picker") ||
    slug.includes("planner") ||
    slug.includes("marathon") ||
    slug.includes("feature")
  ) {
    return "family_variant";
  }
  if (slug.startsWith("franchise-") || slug.startsWith("favorite-") || slug.includes("taste-")) {
    return "family_differentiated";
  }
  if (slug.includes("people-") || slug.endsWith("-similarity") || slug.includes("career")) {
    return "family_variant";
  }
  return "family_variant";
}

export function tierAllowsLive(tier: ImplementationTier): boolean {
  return (
    tier === "distinct" ||
    tier === "family_differentiated" ||
    tier === "family_variant" ||
    tier === "generic_prompt" ||
    tier === "metadata_only" ||
    tier === "route_only"
  );
}

const GENERIC_OUTPUT_PATTERNS = [
  /metadata briefing included/i,
  /connect a chat model in Copilot/i,
  /Use Tonight for constraint-aware picks/i,
  /Open a movie room to analyze votes/i,
  /quote memory search uses catalog keywords/i,
  /Chemistry inferred from shared top-billed credits/i,
  /Genre overlap from/i,
] as const;

