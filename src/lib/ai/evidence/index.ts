import "server-only";

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
  userId?: string | null;
  favorites?: number[];
  history?: number[];
  watchlist?: number[];
}): Promise<EvidencePacket> {
  const sourcesUsed = new Set<string>();
  const movies =
    input.movieIds?.length
      ? await getMoviesEvidence(input.movieIds)
      : await resolveMovieEvidenceFromQuery(input.query);

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
  const movieBlock = formatMovieEvidenceBlock(movies);
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
