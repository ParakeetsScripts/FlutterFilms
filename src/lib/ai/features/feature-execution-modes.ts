/** How a feature actually executes — not marketing labels. */
export type ExecutionMode = "DETERMINISTIC" | "HYBRID" | "GENERATIVE_AI";

const GENERATIVE = new Set([
  "cinema-agent",
  "trailer-concept",
  "review-assistant",
  "cinema-newsletter",
  "weekly-brief",
  "ending-explanation",
  "debate-mode",
  "discussion-starter",
  "food-pairing",
  "atmosphere-mode",
  "spoiler-shield",
  "emotion-timeline",
  "narrative-structure",
  "pacing-search",
  "character-arc",
]);

const HYBRID = new Set([
  "vibe-search",
  "micro-genre",
  "movie-briefing",
  "first-time-guide",
  "character-primer",
  "world-primer",
  "theme-explorer",
  "motif-explorer",
  "symbolism-mode",
  "filmmaking-breakdown",
  "director-intent",
  "why-this-movie",
  "why-not-this-movie",
  "regret-predictor",
  "personality-card",
  "poster-generator",
  "watchlist-poster",
  "movie-night-card",
  "franchise-graphic",
  "comparison-graphic",
  "semantic-catalog",
  "visual-description",
  "relationship-search",
  "actor-chemistry",
  "sentiment-map",
  "taste-expansion-suggestions",
  "taste-blind-spot-finder",
]);

/** Recommendation-variant slugs share deterministic TMDB-backed pick logic. */
const RECOMMEND_VARIANT = /^(instant-pick|movie-roulette|anti-algorithm|taste-expansion|background-mode|no-skip-mode|energy-slider|brain-level|context-aware|regret-predictor|session-planner|double-feature|weekend-marathon|family-planner|short-on-time|like-|.*-picker|.*-similarity|surprised-pick|comfort-zone|more-like|least-like|triple-feature|weekly-movie|couple-planner|anti-regret|discovery-challenge|one-movie|watch-journey|attention-session|late-night|morning-movie|what-watch-next|underseen-actor|friend-recs)$/;

export function executionModeForSlug(slug: string): ExecutionMode {
  if (GENERATIVE.has(slug)) return "GENERATIVE_AI";
  if (HYBRID.has(slug)) return "HYBRID";
  if (RECOMMEND_VARIANT.test(slug)) return "DETERMINISTIC";
  return "DETERMINISTIC";
}
