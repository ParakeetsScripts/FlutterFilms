import type { FeatureDefinition } from "./types";

type Cap = Omit<FeatureDefinition, "id" | "slug" | "title" | "category" | "description" | "href" | "api">;

const catalog: Cap = {
  requiredData: ["catalog"],
  requiredModelCapabilities: [],
  requiresAuth: false,
  hasService: true,
  hasApi: true,
  hasUi: true,
  hasTests: true,
  sourceRequirements: ["tmdb"],
  cachePolicy: "short",
  fallbackBehavior: "graceful_message",
};

const recommend: Cap = { ...catalog, requiredData: ["catalog", "user"], sourceRequirements: ["tmdb", "user"] };
const authUser: Cap = { ...recommend, requiresAuth: true, requiredData: ["catalog", "user", "auth"] };
const franchise: Cap = { ...catalog, requiredData: ["catalog", "franchise"], sourceRequirements: ["tmdb"] };
const people: Cap = { ...catalog, requiredData: ["catalog", "people"], sourceRequirements: ["tmdb"] };

/** Extended catalog entries ship with services but remain beta until acceptance tests land. */
const beta = (over: Partial<Cap> = {}): Cap => ({ ...catalog, ...over, hasTests: false });

const COMPARISON = new Set([
  "movie-vs-movie", "movie-similarity", "tone-similarity", "theme-similarity", "genre-similarity-compare",
  "runtime-similarity", "cast-similarity", "director-similarity-match", "crew-similarity", "era-similarity",
  "language-similarity", "country-similarity", "franchise-similarity-match", "audience-similarity",
]);

const LIKE_VARIANTS = new Set([
  "like-darker", "like-lighter", "like-shorter", "like-more-serious", "like-less-violent", "like-more-mainstream",
]);

const RECOMMEND_EXT = new Set([
  "why-this-movie", "why-not-this-movie", "anti-regret-picker", "rewatch-picker", "discovery-challenge",
  "one-movie-commitment", "surprised-pick", "comfort-zone-pick", "more-like-favorites", "least-like-favorites",
  "triple-feature", "weekly-movie-plan", "couple-planner", "late-night-picker", "morning-movie-picker",
  "what-watch-next", "attention-session-planner", "watch-journey",
]);

const TASTE_EXT = new Set([
  "favorite-actors-rank", "favorite-directors-rank", "favorite-writers-rank", "favorite-languages-rank",
  "favorite-countries-rank", "runtime-taste-preference", "rating-taste-preference", "rewatch-signal-analysis",
  "discovery-diversity-score", "familiarity-balance", "mainstream-niche-score", "taste-expansion-suggestions",
  "taste-blind-spot-finder", "taste-report",
]);

const FRANCHISE_EXT = new Set([
  "franchise-map-visual", "franchise-timeline-ordered", "franchise-release-order", "franchise-chronological-order",
  "franchise-entry-point", "franchise-watch-order-planner", "franchise-similarity-engine", "franchise-spin-off-finder",
  "franchise-remake-tracker", "franchise-adaptation-tracker", "franchise-cast-timeline", "franchise-crew-timeline",
  "franchise-runtime-chart", "franchise-rating-trend", "franchise-genre-shift", "franchise-gap-finder",
  "franchise-missing-movies", "franchise-marathon-planner", "franchise-personal-plan", "franchise-completion-report",
]);

const PEOPLE_EXT = new Set([
  "writer-similarity", "producer-similarity", "cinematographer-similarity", "editor-similarity", "composer-similarity",
  "actor-career-timeline", "director-career-timeline", "writer-career-timeline", "frequent-collaborators",
  "career-breakthrough-analysis", "filmography-explorer", "shared-cast-discovery", "shared-crew-discovery",
  "what-else-they-made", "people-discovery-taste", "people-discovery-filmography", "crew-role-explorer",
  "casting-pattern-finder", "director-style-signature", "performer-range-analysis",
]);

const SOCIAL_EXT = new Set(["group-taste-merge", "room-consensus", "room-tie-breaker"]);
const WATCHLIST_EXT = new Set(["watchlist-prioritizer", "watchlist-randomizer"]);
const HUB_EXT = new Set(["tonight-picker", "cinema-command-center", "cinema-agent-memory-hub"]);

export function extendedCapabilityForSlug(slug: string): Cap | null {
  if (COMPARISON.has(slug) || LIKE_VARIANTS.has(slug)) return beta({ requiredData: ["catalog"] });
  if (RECOMMEND_EXT.has(slug)) return beta({ ...recommend });
  if (TASTE_EXT.has(slug)) return beta({ ...authUser, hasApi: true });
  if (FRANCHISE_EXT.has(slug)) return beta({ ...franchise });
  if (PEOPLE_EXT.has(slug)) return beta({ ...people });
  if (SOCIAL_EXT.has(slug)) return beta({ ...recommend, requiresAuth: slug !== "group-taste-merge" });
  if (WATCHLIST_EXT.has(slug)) return beta({ ...authUser });
  if (HUB_EXT.has(slug)) return beta();
  return null;
}
