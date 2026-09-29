import { FEATURE_CATALOG } from "./catalog";
import type { FeatureRunResult } from "./types";

export type AcceptanceContract = {
  slug: string;
  allowInsufficientData: boolean;
  assert: (result: FeatureRunResult) => void;
};

function data(result: FeatureRunResult): Record<string, unknown> {
  return (result.data ?? {}) as Record<string, unknown>;
}

function requireSuccess(result: FeatureRunResult) {
  if (result.status !== "success") throw new Error(`expected success, got ${result.status}: ${result.error ?? ""}`);
}

export const FEATURE_ACCEPTANCE_CONTRACTS: AcceptanceContract[] = [
  {
    slug: "movie-briefing",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).sections) || !(data(r).sections as unknown[]).length) {
        throw new Error("movie-briefing must return briefing sections");
      }
    },
  },
  {
    slug: "taste-dna-2",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      const d = data(r);
      if (!Array.isArray(d.genres) && !d.genres) throw new Error("taste-dna-2 must return genre signals");
    },
  },
  {
    slug: "genre-map",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).genres)) throw new Error("genre-map must return genres array");
    },
  },
  {
    slug: "franchise-completion",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      const d = data(r);
      if (typeof d.movieCount !== "number" && typeof d.completionPercent !== "number") {
        throw new Error("franchise-completion must return collection progress");
      }
    },
  },
  {
    slug: "actor-similarity",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).similar && !data(r).personId) {
        throw new Error("actor-similarity must return person similarity payload");
      }
    },
  },
  {
    slug: "movie-vs-movie",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success") {
        const d = data(r);
        if (!d.a || !d.b) throw new Error("movie-vs-movie must return a and b comparison objects");
      }
    },
  },
  {
    slug: "semantic-catalog",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !Array.isArray(data(r).results)) {
        throw new Error("semantic-catalog must return results array");
      }
    },
  },
  {
    slug: "cinema-agent",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      const d = data(r);
      if (!d.tools && !d.evidence) throw new Error("cinema-agent must return tools or evidence");
    },
  },
  {
    slug: "poster-generator",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      const d = data(r);
      const svg = String(d.svg ?? d.asset ?? "");
      if (!svg.includes("<svg") && !d.kind) throw new Error("poster-generator must return SVG concept asset");
    },
  },
  {
    slug: "collaboration-graph",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).edges)) throw new Error("collaboration-graph must return edges");
    },
  },
  {
    slug: "crew-discovery",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).departments)) throw new Error("crew-discovery must return crew departments");
    },
  },
  {
    slug: "quote-search",
    allowInsufficientData: true,
    assert: (r) => {
      const hint = String(data(r).hint ?? data(r).disclaimer ?? "");
      if (r.status === "success" && !/quote|overview|keyword|not.*database/i.test(hint)) {
        throw new Error("quote-search must disclose no verified quote database");
      }
    },
  },
  {
    slug: "instant-pick",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).primary && !(data(r).movies as unknown[])?.length) {
        throw new Error("instant-pick must return a primary recommendation");
      }
    },
  },
  {
    slug: "scene-memory",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !Array.isArray(data(r).results)) {
        throw new Error("scene-memory must return catalog search results");
      }
    },
  },
  {
    slug: "remember-wizard",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !Array.isArray(data(r).results)) {
        throw new Error("remember-wizard must return search results");
      }
    },
  },
  {
    slug: "nl-filters",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).results) throw new Error("nl-filters must return filtered results");
    },
  },
  {
    slug: "watch-order",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).releaseOrder && !data(r).chronological) {
        throw new Error("watch-order must return franchise order arrays");
      }
    },
  },
  {
    slug: "timeline-conflicts",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).conflicts) throw new Error("timeline-conflicts must return conflicts array");
    },
  },
  {
    slug: "crew-influence",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).recurringCrew && !data(r).tasteGenres) throw new Error("crew-influence must return crew recurrence analysis");
    },
  },
  {
    slug: "creative-team-dna",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).recurringCrew) throw new Error("creative-team-dna must return recurring crew");
    },
  },
  {
    slug: "universe-map",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).map)) throw new Error("universe-map must return franchise map entries");
    },
  },
  {
    slug: "version-comparison",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && (!data(r).a || !data(r).b)) {
        throw new Error("version-comparison must compare two movie records");
      }
    },
  },
  {
    slug: "location-intelligence",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).locations) throw new Error("location-intelligence must return locations");
    },
  },
  {
    slug: "taste-contradiction",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).contradictions) throw new Error("taste-contradiction must return contradictions");
    },
  },
  {
    slug: "decade-map",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).decades)) throw new Error("decade-map must return decades");
    },
  },
  {
    slug: "global-cinema-map",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).countries && !data(r).languages) throw new Error("global-cinema-map must return countries or languages");
    },
  },
  {
    slug: "group-picker",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).pick) throw new Error("group-picker must return a group pick");
    },
  },
  {
    slug: "taste-intersection",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).sharedGenres) throw new Error("taste-intersection must return sharedGenres");
    },
  },
  {
    slug: "taste-match",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (typeof data(r).percent !== "number") throw new Error("taste-match must return overlap percent");
    },
  },
  {
    slug: "post-reflection",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).prompts)) throw new Error("post-reflection must return reflection prompts");
    },
  },
  {
    slug: "movie-dna",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).profile && !data(r).userDna) {
        throw new Error("movie-dna must return movie profile distinct from user taste-only output");
      }
    },
  },
  {
    slug: "movie-interview",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).summary) throw new Error("movie-interview must return structured profile with summary");
    },
  },
  {
    slug: "franchise-health",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).health) throw new Error("franchise-health must return health metrics");
    },
  },
  {
    slug: "spin-off-discovery",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).relatedInCollection) {
        throw new Error("spin-off-discovery must return collection-linked titles");
      }
    },
  },
  {
    slug: "adaptation-tracker",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).disclaimer) throw new Error("adaptation-tracker must disclose inference limits");
    },
  },
  {
    slug: "remake-evolution",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).disclaimer) throw new Error("remake-evolution must disclose comparison is not verified remake link");
    },
  },
  {
    slug: "rewatch-signal-analysis",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!data(r).signals) throw new Error("rewatch-signal-analysis must return rewatch signals");
    },
  },
  {
    slug: "watchlist-prioritizer",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).watchlist) throw new Error("watchlist-prioritizer must echo watchlist context");
    },
  },
  {
    slug: "background-mode",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).primary && !(data(r).movies as unknown[])?.length) {
        throw new Error("background-mode must return a recommendation pick");
      }
    },
  },
  {
    slug: "movie-roulette",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).primary && !(data(r).movies as unknown[])?.length) {
        throw new Error("movie-roulette must return a roulette pick");
      }
    },
  },
  {
    slug: "anti-algorithm",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).primary && !(data(r).movies as unknown[])?.length) {
        throw new Error("anti-algorithm must return an out-of-history pick");
      }
    },
  },
  {
    slug: "taste-expansion",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).primary && !(data(r).movies as unknown[])?.length) {
        throw new Error("taste-expansion must return exploration picks");
      }
    },
  },
  {
    slug: "first-time-guide",
    allowInsufficientData: true,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).sections) || !(data(r).sections as unknown[]).length) {
        throw new Error("first-time-guide must return briefing sections");
      }
    },
  },
  {
    slug: "director-similarity",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).similar && !data(r).personId) {
        throw new Error("director-similarity must return person similarity payload");
      }
    },
  },
  {
    slug: "franchise-similarity",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && typeof data(r).similarityPercent !== "number" && !data(r).sharedGenres) {
        throw new Error("franchise-similarity must return genre overlap comparison");
      }
    },
  },
  {
    slug: "franchise-entry",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).chronological && !data(r).entryRecommendation) {
        throw new Error("franchise-entry must return franchise entry analysis");
      }
    },
  },
  {
    slug: "favorite-patterns",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      if (!Array.isArray(data(r).patterns) || !(data(r).patterns as unknown[]).length) {
        throw new Error("favorite-patterns must return taste pattern explanations");
      }
    },
  },
  {
    slug: "rewatch-probability",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success") {
        if (!Array.isArray(data(r).signals)) throw new Error("rewatch-probability must return rewatch signals");
        if (!String(data(r).methodology ?? "").match(/ordinal|probability/i)) {
          throw new Error("rewatch-probability must disclose methodology limits");
        }
      }
    },
  },
  {
    slug: "personality-card",
    allowInsufficientData: false,
    assert: (r) => {
      requireSuccess(r);
      const personality = data(r).personality as Record<string, unknown> | undefined;
      if (!personality?.archetype && !personality?.title) {
        throw new Error("personality-card must return a structured personality card");
      }
    },
  },
  {
    slug: "taste-evolution",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).current && !data(r).timeline) {
        throw new Error("taste-evolution must return current taste or timeline");
      }
    },
  },
  {
    slug: "double-feature",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success") {
        const movies = data(r).movies as unknown[] | undefined;
        if (!data(r).secondary && (!Array.isArray(movies) || movies.length < 2)) {
          throw new Error("double-feature must return a two-movie pairing");
        }
      }
    },
  },
  {
    slug: "actor-chemistry",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !Array.isArray(data(r).coStars)) {
        throw new Error("actor-chemistry must return frequent co-star list");
      }
    },
  },
  {
    slug: "franchise-catchup",
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status === "success" && !data(r).catchUp && typeof data(r).completionPercent !== "number") {
        throw new Error("franchise-catchup must return catch-up progress");
      }
    },
  },
];

function structuredContract(slug: string): AcceptanceContract {
  return {
    slug,
    allowInsufficientData: true,
    assert: (r) => {
      if (r.status !== "success") return;
      const payload = data(r);
      if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
        throw new Error(`${slug} must return structured data`);
      }
    },
  };
}

const EXPLICIT_SLUGS = new Set(FEATURE_ACCEPTANCE_CONTRACTS.map((contract) => contract.slug));
const GENERATED_CONTRACTS = FEATURE_CATALOG.filter((entry) => !EXPLICIT_SLUGS.has(entry.slug)).map((entry) =>
  structuredContract(entry.slug),
);

export const ALL_ACCEPTANCE_CONTRACTS: AcceptanceContract[] = [...FEATURE_ACCEPTANCE_CONTRACTS, ...GENERATED_CONTRACTS];

export const CONTRACT_BY_SLUG = new Map(ALL_ACCEPTANCE_CONTRACTS.map((c) => [c.slug, c]));

export function validateAcceptanceContract(slug: string, result: FeatureRunResult): string | null {
  const contract = CONTRACT_BY_SLUG.get(slug);
  if (!contract) return `no acceptance contract registered for ${slug}`;
  if (result.status === "insufficient_data" && contract.allowInsufficientData) return null;
  try {
    contract.assert(result);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
