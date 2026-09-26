import "server-only";

import { getDatabase, isPostgres } from "@/lib/db/client";
import { randomUUID } from "node:crypto";
import type { AnalyticsEventName, AnalyticsProperties } from "./events";

export async function recordAnalyticsEvent(input: {
  name: AnalyticsEventName;
  userId?: string | null;
  sessionId?: string | null;
  path?: string;
  properties?: AnalyticsProperties;
}) {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO analytics_events (id, event_name, user_id, session_id, path, properties_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.userId ?? null,
      input.sessionId ?? null,
      input.path ?? null,
      input.properties ? JSON.stringify(input.properties) : null,
      now,
    ],
  );
  return id;
}

export async function touchSession(sessionId: string, userId?: string | null, userAgent?: string, referrer?: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await db.get<{ id: string }>("SELECT id FROM analytics_sessions WHERE id = ?", [sessionId]);
  if (existing) {
    await db.run("UPDATE analytics_sessions SET last_seen_at = ?, user_id = COALESCE(?, user_id) WHERE id = ?", [
      now,
      userId ?? null,
      sessionId,
    ]);
    return;
  }
  await db.run(
    `INSERT INTO analytics_sessions (id, user_id, started_at, last_seen_at, user_agent, referrer)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, userId ?? null, now, now, userAgent ?? null, referrer ?? null],
  );
}

export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "all";

function rangeStart(range: AnalyticsRange): string | null {
  const now = Date.now();
  if (range === "today") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "90d") return new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

export async function getProductMetrics(range: AnalyticsRange = "7d") {
  const db = await getDatabase();
  const since = rangeStart(range);
  const where = since ? "WHERE created_at > ?" : "";
  const params = since ? [since] : [];

  const [events, sessions, users] = await Promise.all([
    db.get<{ total: number }>(`SELECT COUNT(*) AS total FROM analytics_events ${where}`, params),
    db.get<{ total: number }>(
      since
        ? `SELECT COUNT(DISTINCT session_id) AS total FROM analytics_events WHERE created_at > ? AND session_id IS NOT NULL`
        : `SELECT COUNT(DISTINCT session_id) AS total FROM analytics_events WHERE session_id IS NOT NULL`,
      params,
    ),
    db.get<{ total: number }>("SELECT COUNT(*) AS total FROM users"),
  ]);

  const eventBreakdown = await db.all<{ event_name: string; count: number }>(
    `SELECT event_name, COUNT(*) AS count FROM analytics_events ${where} GROUP BY event_name ORDER BY count DESC LIMIT 20`,
    params,
  );

  const dau = await db.get<{ total: number }>(
    `SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) AS total FROM analytics_events WHERE created_at > ?`,
    [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()],
  );

  const wau = await db.get<{ total: number }>(
    `SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) AS total FROM analytics_events WHERE created_at > ?`,
    [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()],
  );

  let topMovies: Array<{ movie_id: number; count: number }> = [];
  try {
    const movieSql = isPostgres()
      ? `SELECT (properties_json->>'movieId')::int AS movie_id, COUNT(*)::int AS count
         FROM analytics_events WHERE event_name = 'movie_viewed' ${since ? "AND created_at > $1" : ""}
         GROUP BY movie_id ORDER BY count DESC LIMIT 10`
      : `SELECT json_extract(properties_json, '$.movieId') AS movie_id, COUNT(*) AS count
         FROM analytics_events WHERE event_name = 'movie_viewed' ${since ? "AND created_at > ?" : ""}
         GROUP BY movie_id ORDER BY count DESC LIMIT 10`;
    topMovies = await db.all(movieSql, params);
  } catch {
    topMovies = [];
  }

  const totalEvents = Number(events?.total ?? 0);
  const registeredUsers = Number(users?.total ?? 0);

  return {
    range,
    insufficientData: totalEvents < 5 && registeredUsers < 3,
    registeredUsers,
    totalEvents,
    sessions: Number(sessions?.total ?? 0),
    dailyActiveUsers: Number(dau?.total ?? 0),
    weeklyActiveUsers: Number(wau?.total ?? 0),
    eventBreakdown,
    topMovies: topMovies.filter((m) => m.movie_id),
    funnel: {
      pageViews: eventBreakdown.find((e) => e.event_name === "page_view")?.count ?? 0,
      searches: eventBreakdown.find((e) => e.event_name === "movie_searched")?.count ?? 0,
      movieViews: eventBreakdown.find((e) => e.event_name === "movie_viewed")?.count ?? 0,
      watchlistAdds: eventBreakdown.find((e) => e.event_name === "watchlist_added")?.count ?? 0,
      aiPrompts: eventBreakdown.find((e) => e.event_name === "ai_prompt_submitted")?.count ?? 0,
    },
  };
}
