import "server-only";

import { computeTasteDna } from "../intelligence/taste";
import type { UserTasteEvidence } from "./types";

export async function getUserTasteContext(input: {
  favorites?: number[];
  history?: number[];
  watchlist?: number[];
}): Promise<UserTasteEvidence | null> {
  const favorites = input.favorites ?? [];
  const history = input.history ?? [];
  const watchlist = input.watchlist ?? [];
  const ids = [...new Set([...favorites, ...history, ...watchlist])];
  if (!ids.length) return null;

  const dna = await computeTasteDna(ids);
  const topGenres = dna.genres.slice(0, 5).map((g) => g.name);

  return {
    favoriteCount: favorites.length,
    historyCount: history.length,
    watchlistCount: watchlist.length,
    topGenres,
    sources: [{ source: "user" }, { source: "tmdb" }],
  };
}

export function formatUserTasteBlock(taste: UserTasteEvidence): string {
  const parts = [
    `Favorites: ${taste.favoriteCount}`,
    `Watch history: ${taste.historyCount}`,
    `Watchlist: ${taste.watchlistCount}`,
  ];
  if (taste.topGenres.length) {
    parts.push(`Top genres from your library: ${taste.topGenres.join(", ")}`);
  }
  return parts.join(" · ");
}
