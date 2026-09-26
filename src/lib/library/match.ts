import { searchMovies } from "@/lib/tmdb/search";
import { getMovie } from "@/lib/tmdb/movies";
import { parseMediaFilename, type ParsedFilename } from "./filename";
import { rankCandidate, type MatchCandidate } from "./ranking";

export type { MatchCandidate };

export async function matchLocalFilename(filename: string): Promise<{
  parsed: ParsedFilename;
  candidates: MatchCandidate[];
}> {
  const parsed = parseMediaFilename(filename);
  if (parsed.tmdbId) {
    const movie = await getMovie(parsed.tmdbId);
    return {
      parsed,
      candidates: movie
        ? [{ movie, score: 1, reason: "Exact TMDB ID from filename" }]
        : [],
    };
  }

  if (!parsed.title) {
    return { parsed, candidates: [] };
  }

  const page = await searchMovies(parsed.title, 1, parsed.year ?? undefined);
  const candidates = page.results
    .map((movie) => rankCandidate(parsed, movie))
    .sort((a, b) => b.score - a.score);
  return { parsed, candidates };
}

export { rankCandidate };
