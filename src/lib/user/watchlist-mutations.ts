import "server-only";

import { getWatchlist, saveWatchlist } from "./repository";

export async function addMovieToWatchlist(userId: string, movieId: number) {
  const current = await getWatchlist(userId);
  if (current.includes(movieId)) {
    return { watchlist: current, added: false };
  }
  const next = [...current, movieId];
  await saveWatchlist(userId, next);
  return { watchlist: next, added: true };
}

export async function removeMovieFromWatchlist(userId: string, movieId: number) {
  const current = await getWatchlist(userId);
  const next = current.filter((id) => id !== movieId);
  await saveWatchlist(userId, next);
  return { watchlist: next, removed: current.length !== next.length };
}
