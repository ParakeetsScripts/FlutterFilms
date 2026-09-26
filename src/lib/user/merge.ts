import type { UserLibrarySnapshot } from "./library-repository";

export type DevicePayload = {
  watchlist?: number[];
  favorites?: number[];
  history?: Array<{ movieId: number; viewedAt: string }>;
  continueWatching?: UserLibrarySnapshot["continueWatching"];
  settings?: Record<string, unknown>;
  tasteDna?: Record<string, unknown>;
};

export function mergeLibraries(
  server: UserLibrarySnapshot,
  device: DevicePayload,
  mode: "all" | "selective" | "skip",
  selected?: Partial<Record<"watchlist" | "favorites" | "history" | "continue" | "settings", boolean>>,
): UserLibrarySnapshot {
  if (mode === "skip") return server;

  const pick = (key: keyof NonNullable<typeof selected>) => mode === "all" || selected?.[key];

  const watchlist = pick("watchlist")
    ? [...new Set([...server.watchlist, ...(device.watchlist ?? [])])]
    : server.watchlist;

  const favorites = pick("favorites")
    ? [...new Set([...server.favorites, ...(device.favorites ?? [])])]
    : server.favorites;

  const historyMap = new Map(server.history.map((h) => [h.movieId, h.viewedAt]));
  if (pick("history")) {
    for (const item of device.history ?? []) {
      const existing = historyMap.get(item.movieId);
      if (!existing || item.viewedAt > existing) historyMap.set(item.movieId, item.viewedAt);
    }
  }

  const continueMap = new Map(server.continueWatching.map((c) => [c.movieId, c]));
  if (pick("continue")) {
    for (const item of device.continueWatching ?? []) {
      const existing = continueMap.get(item.movieId);
      if (!existing || item.updatedAt > existing.updatedAt) continueMap.set(item.movieId, item);
    }
  }

  const settings = pick("settings") ? { ...device.settings, ...server.settings } : server.settings;

  return {
    watchlist,
    favorites,
    history: [...historyMap.entries()].map(([movieId, viewedAt]) => ({ movieId, viewedAt })),
    continueWatching: [...continueMap.values()],
    settings,
  };
}
