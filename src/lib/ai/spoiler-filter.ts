import type { MovieEvidence } from "./evidence/types";
import type { SpoilerLevel } from "./intelligence/briefing";

export type SpoilerClass = "safe" | "light" | "moderate" | "major" | "ending";

const ENDING_PATTERNS =
  /\b(ending|at the end|finale|final scene|twist|dies|death|killed|reveal|betray|post-credit|who dies|what happens)\b/i;

export function truncateForSpoiler(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

/** Strip plot-heavy fields before evidence reaches the model. */
export function filterMovieEvidenceForSpoiler(
  movies: MovieEvidence[],
  spoilerLevel: SpoilerLevel,
): MovieEvidence[] {
  return movies.map((movie) => {
    const tmdb = movie.tmdb ? { ...movie.tmdb } : undefined;
    if (!tmdb) return movie;

    if (spoilerLevel === "none") {
      delete tmdb.overview;
      delete tmdb.tagline;
    } else if (spoilerLevel === "light" && tmdb.overview) {
      tmdb.overview = truncateForSpoiler(tmdb.overview, 320);
    }

    if (spoilerLevel !== "full" && tmdb.keywords?.length) {
      tmdb.keywords = tmdb.keywords.slice(0, 4);
    }

    return { ...movie, tmdb };
  });
}

export function overviewLineForSpoiler(
  overview: string | null | undefined,
  spoilerLevel: SpoilerLevel,
): string | null {
  const text = overview?.trim();
  if (!text) return null;
  if (spoilerLevel === "none") return null;
  if (spoilerLevel === "light") return `Premise (light spoilers): ${truncateForSpoiler(text, 320)}`;
  if (spoilerLevel === "moderate") return `Synopsis (moderate spoilers): ${text}`;
  return `Plot context (full spoilers): ${text}`;
}

export function isEndingQuestion(message: string): boolean {
  return ENDING_PATTERNS.test(message);
}

export function spoilerEscalationMessage(current: SpoilerLevel): string {
  if (current === "full") return "";
  return `That answer may contain major plot details. Switch spoiler protection to Full in FlutterAI or the movie intelligence panel, then ask again.`;
}
