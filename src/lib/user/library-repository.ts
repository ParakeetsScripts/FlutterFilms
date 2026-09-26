import "server-only";

import { getDatabase } from "@/lib/db/client";

export type UserLibrarySnapshot = {
  watchlist: number[];
  favorites: number[];
  history: Array<{ movieId: number; viewedAt: string }>;
  continueWatching: Array<{
    movieId: number;
    positionSeconds: number;
    durationSeconds: number;
    kind: string;
    updatedAt: string;
  }>;
  settings: Record<string, unknown>;
};

export async function getUserLibrary(userId: string): Promise<UserLibrarySnapshot> {
  const db = await getDatabase();
  const [watchlist, favorites, history, continueRows, prefs] = await Promise.all([
    db.all<{ movie_id: number }>("SELECT movie_id FROM user_watchlist WHERE user_id = ? ORDER BY position", [userId]),
    db.all<{ movie_id: number }>("SELECT movie_id FROM user_favorites WHERE user_id = ? ORDER BY added_at DESC", [userId]),
    db.all<{ movie_id: number; viewed_at: string }>(
      "SELECT movie_id, viewed_at FROM user_history WHERE user_id = ? ORDER BY viewed_at DESC",
      [userId],
    ),
    db.all<{
      movie_id: number;
      position_seconds: number;
      duration_seconds: number;
      kind: string;
      updated_at: string;
    }>("SELECT * FROM user_continue_watching WHERE user_id = ?", [userId]),
    db.get<{ settings_json: string }>("SELECT settings_json FROM user_preferences WHERE user_id = ?", [userId]),
  ]);

  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(String(prefs?.settings_json ?? "{}"));
  } catch {
    settings = {};
  }

  return {
    watchlist: watchlist.map((r) => r.movie_id),
    favorites: favorites.map((r) => r.movie_id),
    history: history.map((r) => ({ movieId: r.movie_id, viewedAt: r.viewed_at })),
    continueWatching: continueRows.map((r) => ({
      movieId: r.movie_id,
      positionSeconds: r.position_seconds,
      durationSeconds: r.duration_seconds,
      kind: r.kind,
      updatedAt: r.updated_at,
    })),
    settings,
  };
}

export async function saveUserLibrary(userId: string, snapshot: Partial<UserLibrarySnapshot>) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (snapshot.watchlist) {
    await db.run("DELETE FROM user_watchlist WHERE user_id = ?", [userId]);
    for (const [index, movieId] of snapshot.watchlist.entries()) {
      await db.run(
        "INSERT INTO user_watchlist (user_id, movie_id, position, added_at) VALUES (?, ?, ?, ?)",
        [userId, movieId, index, now],
      );
    }
  }

  if (snapshot.favorites) {
    await db.run("DELETE FROM user_favorites WHERE user_id = ?", [userId]);
    for (const movieId of snapshot.favorites) {
      await db.run("INSERT INTO user_favorites (user_id, movie_id, added_at) VALUES (?, ?, ?)", [userId, movieId, now]);
    }
  }

  if (snapshot.history) {
    for (const item of snapshot.history) {
      const existing = await db.get<{ viewed_at: string }>(
        "SELECT viewed_at FROM user_history WHERE user_id = ? AND movie_id = ?",
        [userId, item.movieId],
      );
      if (!existing || item.viewedAt > existing.viewed_at) {
        await db.run(
          `INSERT INTO user_history (user_id, movie_id, viewed_at) VALUES (?, ?, ?)
           ON CONFLICT(user_id, movie_id) DO UPDATE SET viewed_at = excluded.viewed_at`,
          [userId, item.movieId, item.viewedAt],
        );
      }
    }
  }

  if (snapshot.continueWatching) {
    for (const item of snapshot.continueWatching) {
      await db.run(
        `INSERT INTO user_continue_watching (user_id, movie_id, position_seconds, duration_seconds, kind, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, movie_id) DO UPDATE SET
           position_seconds = excluded.position_seconds,
           duration_seconds = excluded.duration_seconds,
           kind = excluded.kind,
           updated_at = excluded.updated_at`,
        [userId, item.movieId, item.positionSeconds, item.durationSeconds, item.kind, item.updatedAt],
      );
    }
  }

  if (snapshot.settings) {
    await db.run(
      `INSERT INTO user_preferences (user_id, settings_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at`,
      [userId, JSON.stringify(snapshot.settings), now],
    );
  }
}
