import "server-only";

import type { SpoilerLevel } from "../intelligence/briefing";
import { filterMovieEvidenceForSpoiler } from "../spoiler-filter";
import { formatMovieEvidenceBlock, getMoviesEvidence, resolveMovieEvidenceFromQuery } from "./movie";
import { formatUserTasteBlock, getUserTasteEvidence } from "./user";
import type { EvidencePacket } from "./types";

export type { MovieEvidence, UserTasteEvidence, EvidencePacket, EvidenceSource, ProvenanceField } from "./types";
export { getMovieEvidence, getMoviesEvidence, resolveMovieEvidenceFromQuery, formatMovieEvidenceBlock } from "./movie";
export { getUserTasteEvidence, formatUserTasteBlock } from "./user";
export { movieEvidenceFromCatalog } from "./types";

export async function buildEvidencePacket(input: {
  query: string;
  movieIds?: number[];
  spoilerLevel?: SpoilerLevel;
  userId?: string | null;
  favorites?: number[];
  history?: number[];
  watchlist?: number[];
}): Promise<EvidencePacket> {
  const sourcesUsed = new Set<string>();
  const rawMovies =
    input.movieIds?.length
      ? await getMoviesEvidence(input.movieIds)
      : await resolveMovieEvidenceFromQuery(input.query);
  const movies = input.spoilerLevel
    ? filterMovieEvidenceForSpoiler(rawMovies, input.spoilerLevel)
    : rawMovies;

  for (const m of movies) {
    for (const s of m.sources) {
      sourcesUsed.add(s.source === "tmdb" ? "TMDB" : s.source === "imdb" ? "IMDb" : "FlutterFilms");
    }
  }

  const userTaste = await getUserTasteEvidence({
    userId: input.userId,
    favorites: input.favorites,
    history: input.history,
    watchlist: input.watchlist,
  });
  if (userTaste) sourcesUsed.add("FlutterFilms taste profile");

  const blocks: string[] = [];
  const movieBlock = formatMovieEvidenceBlock(movies, input.spoilerLevel);
  if (movieBlock) {
    blocks.push(`VERIFIED MOVIE DATA (authoritative for facts — do not contradict):\n${movieBlock}`);
  }
  if (userTaste) {
    blocks.push(`USER TASTE SIGNALS (only cite when relevant):\n${formatUserTasteBlock(userTaste)}`);
  }

  return {
    movies,
    userTaste: userTaste ?? undefined,
    sourcesUsed: [...sourcesUsed],
    textBlock: blocks.join("\n\n"),
  };
}
