import "server-only";

import { formatMovieEvidenceBlock, getMoviesContext, resolveMovieContextFromQuery } from "./movie";
import { formatUserTasteBlock, getUserTasteContext } from "./user";
import type { EvidencePacket } from "./types";

export type { MovieEvidence, UserTasteEvidence, EvidencePacket, SourceReference } from "./types";
export { getMovieContext, getMoviesContext, resolveMovieContextFromQuery, formatMovieEvidenceBlock } from "./movie";
export { getUserTasteContext, formatUserTasteBlock } from "./user";

export async function buildEvidencePacket(input: {
  query: string;
  movieIds?: number[];
  favorites?: number[];
  history?: number[];
  watchlist?: number[];
}): Promise<EvidencePacket> {
  const sourcesUsed = new Set<string>();
  const movies =
    input.movieIds?.length
      ? await getMoviesContext(input.movieIds)
      : await resolveMovieContextFromQuery(input.query);

  for (const m of movies) {
    for (const s of m.sources) sourcesUsed.add(s.source === "tmdb" ? "TMDB" : s.source === "imdb" ? "IMDb" : "Flutter Films");
  }

  const userTaste = await getUserTasteContext({
    favorites: input.favorites,
    history: input.history,
    watchlist: input.watchlist,
  });
  if (userTaste) sourcesUsed.add("Flutter Films taste profile");

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
