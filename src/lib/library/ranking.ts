import type { MovieSummary } from "@/lib/tmdb/types";
import type { ParsedFilename } from "./filename";

export type MatchCandidate = {
  movie: MovieSummary;
  score: number;
  reason: string;
};

export function rankCandidate(parsed: ParsedFilename, movie: MovieSummary): MatchCandidate {
  const title = parsed.title?.toLowerCase() ?? "";
  const movieTitle = movie.title.toLowerCase();
  const original = movie.originalTitle?.toLowerCase() ?? "";
  let score = 0;
  let reason = "Title search";

  if (title && (movieTitle === title || original === title)) {
    score += 0.6;
    reason = "Exact title";
  } else if (title && (movieTitle.includes(title) || original.includes(title))) {
    score += 0.3;
  } else {
    score += 0.1;
  }

  if (parsed.year && movie.year === parsed.year) {
    score += 0.35;
    reason = `${reason} + year`;
  } else if (parsed.year && movie.year && Math.abs(movie.year - parsed.year) === 1) {
    score += 0.1;
  }

  if ((movie.popularity ?? 0) > 20) score += 0.05;
  return { movie, score: Math.min(score, 1), reason };
}
