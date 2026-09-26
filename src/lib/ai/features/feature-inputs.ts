/** Default POST input fixtures for acceptance tests and FeatureDetail auto-fill. */
export const DEFAULT_FIXTURE_IDS = {
  movieId: 550,
  compareMovieId: 680,
  personId: 525,
  collectionId: 9485,
  collectionIdB: 263,
} as const;

const QUERY_SLUGS = new Set([
  "vibe-search", "nl-filters", "scene-memory", "remember-wizard", "semantic-catalog",
  "visual-description", "narrative-structure", "pacing-search", "character-arc", "relationship-search",
  "quote-search", "emotion-timeline", "micro-genre",
]);

const MOVIE_SLUGS = new Set([
  "movie-briefing", "first-time-guide", "character-primer", "world-primer", "theme-explorer",
  "motif-explorer", "symbolism-mode", "filmmaking-breakdown", "ending-explanation", "spoiler-shield",
  "location-intelligence", "movie-dna", "post-reflection", "rewatch-reflection", "why-this-movie",
  "why-not-this-movie", "debate-mode", "discussion-starter", "food-pairing", "atmosphere-mode",
  "director-intent", "production-challenges", "spoiler-rooms",
]);

const COMPARE_SLUGS = new Set([
  "movie-vs-movie", "version-comparison",
]);

const PERSON_SLUGS = new Set([
  "actor-similarity", "director-similarity", "career-turning-points", "filmography-journey",
  "actor-chemistry", "collaboration-graph", "writer-similarity", "producer-similarity",
  "cinematographer-similarity", "editor-similarity", "composer-similarity", "actor-career-timeline",
  "director-career-timeline", "writer-career-timeline", "frequent-collaborators",
  "career-breakthrough-analysis", "filmography-explorer", "shared-cast-discovery", "shared-crew-discovery",
  "what-else-they-made", "people-discovery-taste", "people-discovery-filmography", "crew-role-explorer",
  "casting-pattern-finder", "director-style-signature", "performer-range-analysis",
]);

const FRANCHISE_SLUGS = new Set([
  "franchise-health", "timeline-conflicts", "watch-order", "franchise-entry",
  "franchise-completion", "franchise-similarity", "spin-off-discovery", "universe-map", "adaptation-tracker",
  "franchise-map-visual", "franchise-timeline-ordered", "franchise-release-order", "franchise-chronological-order",
  "franchise-entry-point", "franchise-watch-order-planner", "franchise-similarity-engine", "franchise-spin-off-finder",
  "franchise-remake-tracker", "franchise-adaptation-tracker", "franchise-cast-timeline", "franchise-crew-timeline",
  "franchise-runtime-chart", "franchise-rating-trend", "franchise-genre-shift", "franchise-gap-finder",
  "franchise-missing-movies", "franchise-marathon-planner", "franchise-personal-plan", "franchise-completion-report",
  "franchise-similarity-match",
]);

const MESSAGE_SLUGS = new Set(["cinema-agent"]);

const PROFILES_SLUGS = new Set(["group-picker", "taste-intersection", "taste-match", "couple-planner", "group-taste-merge", "friend-recs"]);

export function defaultInputForSlug(slug: string): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  if (QUERY_SLUGS.has(slug)) input.query = "dark sci-fi thriller";
  if (MOVIE_SLUGS.has(slug) || slug.includes("like-") || slug.includes("similarity")) {
    input.movieId = DEFAULT_FIXTURE_IDS.movieId;
  }
  if (COMPARE_SLUGS.has(slug) || slug === "franchise-similarity") {
    input.movieId = DEFAULT_FIXTURE_IDS.movieId;
    input.compareMovieId = DEFAULT_FIXTURE_IDS.compareMovieId;
    input.collectionIdA = DEFAULT_FIXTURE_IDS.collectionId;
    input.collectionIdB = DEFAULT_FIXTURE_IDS.collectionIdB;
  }
  if (PERSON_SLUGS.has(slug)) input.personId = DEFAULT_FIXTURE_IDS.personId;
  if (slug === "franchise-catchup" || FRANCHISE_SLUGS.has(slug) || slug === "remake-evolution") {
    input.collectionId = DEFAULT_FIXTURE_IDS.collectionId;
    input.collectionIdA = DEFAULT_FIXTURE_IDS.collectionId;
    input.collectionIdB = DEFAULT_FIXTURE_IDS.collectionIdB;
  }
  if (MESSAGE_SLUGS.has(slug)) input.message = "Recommend a sci-fi movie under 150 minutes";
  if (PROFILES_SLUGS.has(slug)) {
    input.profiles = [
      { label: "You", movieIds: [550, 680] },
      { label: "Friend", movieIds: [13, 155] },
    ];
    input.profileA = { label: "You", movieIds: [550, 680] };
    input.profileB = { label: "Friend", movieIds: [13, 155] };
    input.friendProfile = { label: "Friend", movieIds: [13, 155] };
    input.partnerMovieIds = [13, 155];
  }
  if (slug === "movie-interview") input.answers = { mood: "thoughtful", pace: "slow" };
  if (slug === "post-reflection") {
    input.movieId = DEFAULT_FIXTURE_IDS.movieId;
    input.reflection = { mood: "thoughtful", wouldRewatch: true };
  }
  if (slug === "smart-resume") input.progress = { movieId: DEFAULT_FIXTURE_IDS.movieId, percent: 42 };
  if (slug === "shared-watchlists") input.watchlistId = "00000000-0000-4000-8000-000000000099";
  if (slug === "movie-room") input.code = "DEMO";
  if (slug === "spoiler-rooms") {
    input.code = "DEMO";
    input.movieId = DEFAULT_FIXTURE_IDS.movieId;
  }
  if (slug === "friend-recs") {
    input.friendProfile = { label: "Friend", movieIds: [13, 155] };
  }
  if (slug === "poster-generator" || slug.includes("poster") || slug.includes("graphic") || slug.includes("card")) {
    input.title = "Movie Night";
    input.movies = [{ title: "Fight Club", year: 1999 }];
  }

  return input;
}
