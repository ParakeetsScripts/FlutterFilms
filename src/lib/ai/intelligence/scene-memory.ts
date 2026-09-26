import "server-only";

import { semanticSearch } from "./semantic-search";
import { parseSceneDescription } from "./scene-memory-parser";
import { trustBadge } from "../trust";
import type { MovieSummary } from "@/lib/tmdb/types";

export type SceneMatch = {
  movie: MovieSummary;
  confidence: "low" | "medium" | "high";
  matchingClues: string[];
  missingInfo: string[];
};

export { parseSceneDescription } from "./scene-memory-parser";

function scoreMatch(movie: MovieSummary, parsed: ReturnType<typeof parseSceneDescription>, query: string): SceneMatch {
  const matching: string[] = [];
  let score = 0;

  if (parsed.yearHint && movie.year) {
    const diff = Math.abs(movie.year - parsed.yearHint);
    if (diff <= 2) {
      score += 3;
      matching.push(`Release year ${movie.year} matches era hint`);
    } else if (diff <= 8) {
      score += 1;
      matching.push(`Release year ${movie.year} is close to era hint`);
    }
  }

  const overview = `${movie.title} ${movie.overview ?? ""}`.toLowerCase();
  for (const clue of parsed.clues) {
    const tokens = clue.value.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const hits = tokens.filter((t) => overview.includes(t));
    if (hits.length >= 2) {
      score += 2;
      matching.push(`Overview mentions: ${hits.slice(0, 3).join(", ")}`);
    }
  }

  if (movie.title.toLowerCase().split(/\s+/).some((w) => query.toLowerCase().includes(w) && w.length > 4)) {
    score += 2;
    matching.push("Title keyword overlap");
  }

  const confidence: SceneMatch["confidence"] = score >= 5 ? "high" : score >= 3 ? "medium" : "low";
  return { movie, confidence, matchingClues: matching, missingInfo: parsed.missing };
}

export async function searchSceneMemory(parts: string[]) {
  const parsed = parseSceneDescription(parts);
  const search = await semanticSearch(parsed.text, "scene");

  const matches = search.results
    .map((m) => scoreMatch(m, parsed, parsed.text))
    .sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.confidence] - order[a.confidence];
    })
    .slice(0, 12);

  return {
    query: parsed.text,
    clues: parsed.clues,
    missingInfo: parsed.missing,
    matches,
    results: matches.map((m) => m.movie),
    hint:
      matches[0]?.confidence === "high"
        ? "Strong catalog overlap — still verify by watching a trailer."
        : "Possible matches only — add more clues if these look wrong.",
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
    disclaimer: "Confidence reflects metadata overlap, not certainty.",
  };
}
