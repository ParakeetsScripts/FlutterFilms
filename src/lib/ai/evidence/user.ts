import "server-only";

import { isDatabaseUserId } from "@/lib/user/ids";
import { listTasteSignals } from "@/lib/user/taste-repository";
import { computeTasteDna } from "../intelligence/taste";
import type { UserTasteEvidence } from "./types";

export async function getUserTasteEvidence(input: {
  userId?: string | null;
  favorites?: number[];
  history?: number[];
  watchlist?: number[];
}): Promise<UserTasteEvidence | null> {
  const favorites = input.favorites ?? [];
  const history = input.history ?? [];
  const watchlist = input.watchlist ?? [];
  const ids = [...new Set([...favorites, ...history, ...watchlist])];
  if (!ids.length && !input.userId) return null;

  const dna = ids.length ? await computeTasteDna(ids) : null;
  const signals = isDatabaseUserId(input.userId) ? await listTasteSignals(input.userId!) : [];

  const favoritePeople = signals
    .filter((s) => s.signalKey === "favorite_person")
    .map((s) => s.signalValue)
    .slice(0, 8);
  const favoriteLanguages = signals
    .filter((s) => s.signalKey === "favorite_language")
    .map((s) => s.signalValue)
    .slice(0, 8);

  if (!dna && !signals.length) return null;

  return {
    favoriteCount: favorites.length,
    historyCount: history.length,
    watchlistCount: watchlist.length,
    topGenres: dna?.genres.slice(0, 5).map((g) => g.name) ?? [],
    favoritePeople,
    favoriteLanguages,
    sources: [{ source: "user" }, { source: "flutter_films" }, { source: "tmdb" }],
  };
}

export function formatUserTasteBlock(taste: UserTasteEvidence): string {
  const parts = [
    `Favorites: ${taste.favoriteCount}`,
    `Watch history: ${taste.historyCount}`,
    `Watchlist: ${taste.watchlistCount}`,
  ];
  if (taste.topGenres.length) parts.push(`Top genres from your library: ${taste.topGenres.join(", ")}`);
  if (taste.favoritePeople.length) parts.push(`Favorite people: ${taste.favoritePeople.join(", ")}`);
  if (taste.favoriteLanguages.length) parts.push(`Languages: ${taste.favoriteLanguages.join(", ")}`);
  return parts.join(" · ");
}
