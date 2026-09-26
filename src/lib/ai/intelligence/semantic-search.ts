import "server-only";

import { searchCatalog } from "@/lib/sync/catalog";
import { discoverMovies } from "@/lib/tmdb/discover";
import { trustBadge } from "../trust";

const STRUCTURE_KEYWORDS: Record<string, RegExp> = {
  nonlinear: /nonlinear|out of order|flashback/i,
  anthology: /anthology|short stories|tales/i,
  "single-location": /single location|one room|one house|bottle episode/i,
  ensemble: /ensemble|multiple perspectives/i,
};

const PACING_KEYWORDS: Record<string, RegExp> = {
  "slow-burn": /slow burn|gradual|patient/i,
  "constant-action": /nonstop|constant action|fast paced/i,
};

const ARC_KEYWORDS: Record<string, RegExp> = {
  redemption: /redemption|second chance/i,
  revenge: /revenge|vengeance/i,
  "coming-of-age": /coming of age|growing up/i,
};

const RELATIONSHIP_KEYWORDS: Record<string, RegExp> = {
  rivals: /rivals|nemesis|enemies/i,
  siblings: /siblings|brother|sister|family drama/i,
  mentor: /mentor|student|teacher/i,
  romance: /romance|love story|relationship/i,
  friendship: /friendship|best friends|buddy/i,
  ensemble: /ensemble|group of friends/i,
};

export async function semanticSearch(
  query: string,
  kind: "scene" | "visual" | "structure" | "pacing" | "arc" | "relationship" | "general" = "general",
) {
  const q = query.trim();
  let hint = "Catalog semantic search";
  let ratingGte: number | undefined;

  const maps: Record<string, RegExp> = {
    structure: STRUCTURE_KEYWORDS,
    pacing: PACING_KEYWORDS,
    arc: ARC_KEYWORDS,
    relationship: RELATIONSHIP_KEYWORDS,
    scene: {},
    visual: {},
    general: {},
  }[kind];

  for (const [label, pattern] of Object.entries(maps)) {
    if (pattern.test(q)) {
      hint = `Matched narrative signal: ${label}`;
      break;
    }
  }

  if (/under \d+ minutes|short film|quick watch/i.test(q)) {
    hint = "Short runtime intent — filter at watch time using runtime metadata.";
  }

  if (kind === "visual" || /color|palette|rain|neon|noir/i.test(q)) {
    ratingGte = 6.5;
    hint = "Visual/atmosphere query — ranked by catalog text + ratings metadata.";
  }

  const [local, discovered] = await Promise.all([
    searchCatalog(q, 1),
    discoverMovies({ sort: ratingGte ? "rating" : "popularity", ratingGte }),
  ]);

  const results = [...local.results];
  for (const m of discovered.results) {
    if (!results.find((r) => r.id === m.id)) results.push(m);
  }

  return {
    query: q,
    kind,
    hint,
    results: results.slice(0, 20),
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
  };
}
