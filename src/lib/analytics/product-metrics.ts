import "server-only";

import { getDatabase, isPostgres } from "@/lib/db/client";
import { getRetentionMetrics } from "./retention";
import type { AnalyticsRange } from "./repository";

function rangeStart(range: AnalyticsRange): string | null {
  const now = Date.now();
  if (range === "today") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "90d") return new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

function countEvents(
  breakdown: Array<{ event_name: string; count: number }>,
  names: string[],
): number {
  return breakdown
    .filter((e) => names.includes(e.event_name))
    .reduce((sum, e) => sum + e.count, 0);
}

export async function getFullProductDashboard(range: AnalyticsRange = "7d") {
  const db = await getDatabase();
  const since = rangeStart(range);
  const where = since ? "WHERE created_at > ?" : "";
  const params = since ? [since] : [];
  const now = new Date().toISOString();

  const [events, sessions, users, eventBreakdown, retention] = await Promise.all([
    db.get<{ total: number }>(`SELECT COUNT(*) AS total FROM analytics_events ${where}`, params),
    db.get<{ total: number }>(
      since
        ? `SELECT COUNT(DISTINCT session_id) AS total FROM analytics_events WHERE created_at > ? AND session_id IS NOT NULL`
        : `SELECT COUNT(DISTINCT session_id) AS total FROM analytics_events WHERE session_id IS NOT NULL`,
      params,
    ),
    db.get<{ total: number }>("SELECT COUNT(*) AS total FROM users"),
    db.all<{ event_name: string; count: number }>(
      `SELECT event_name, COUNT(*) AS count FROM analytics_events ${where} GROUP BY event_name`,
      params,
    ),
    getRetentionMetrics(),
  ]);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [dau, wau, mau] = await Promise.all([
    db.get<{ total: number }>(
      `SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) AS total FROM analytics_events WHERE created_at > ?`,
      [dayAgo],
    ),
    db.get<{ total: number }>(
      `SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) AS total FROM analytics_events WHERE created_at > ?`,
      [weekAgo],
    ),
    db.get<{ total: number }>(
      `SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) AS total FROM analytics_events WHERE created_at > ?`,
      [monthAgo],
    ),
  ]);

  const totalEvents = Number(events?.total ?? 0);
  const registeredUsers = Number(users?.total ?? 0);
  const breakdown = eventBreakdown ?? [];

  const pageViews = countEvents(breakdown, ["page_viewed", "page_view"]);
  const searches = countEvents(breakdown, ["search_performed", "movie_searched"]);
  const movieViews = countEvents(breakdown, ["movie_viewed"]);
  const aiPrompts = countEvents(breakdown, ["ai_prompt_submitted"]);
  const aiResponses = countEvents(breakdown, ["ai_response_completed", "ai_response_received"]);
  const agentSessions = countEvents(breakdown, ["cinema_agent_used", "agent_tool_called"]);

  return {
    range,
    lastUpdated: now,
    eventCount: totalEvents,
    insufficientData: totalEvents < 5 && registeredUsers < 3,
    acquisition: {
      visitors: Number(sessions?.total ?? 0),
      sessions: Number(sessions?.total ?? 0),
      newUsers: countEvents(breakdown, ["signup_completed"]),
      returningUsers: Number(retention.funnel.returned),
    },
    activation: retention,
    engagement: {
      dau: Number(dau?.total ?? 0),
      wau: Number(wau?.total ?? 0),
      mau: Number(mau?.total ?? 0),
      movieViews,
      searches,
      aiSessions: agentSessions + aiPrompts,
      sessionDepth: totalEvents && sessions?.total ? Math.round(totalEvents / Number(sessions.total)) : 0,
    },
    social: {
      roomsCreated: countEvents(breakdown, ["room_created"]),
      roomJoins: countEvents(breakdown, ["room_joined"]),
      roomVotes: countEvents(breakdown, ["room_vote", "room_vote_created"]),
      sharedLists: countEvents(breakdown, ["shared_watchlist_created", "shared_list_created"]),
      sharedListMovies: countEvents(breakdown, ["shared_watchlist_movie_added", "shared_list_movie_added"]),
    },
    ai: {
      prompts: aiPrompts,
      responses: aiResponses,
      toolCalls: countEvents(breakdown, ["agent_tool_called"]),
      recommendations: countEvents(breakdown, ["recommendation_shown", "recommendation_clicked", "recommendation_saved"]),
    },
    funnel: {
      visitors: pageViews,
      searches,
      movieViews,
      aiInteraction: aiPrompts + agentSessions,
      saves: countEvents(breakdown, ["watchlist_added", "favorite_added", "recommendation_saved"]),
      returns: Number(retention.funnel.returned),
    },
    conversions: {
      searchRate: pageViews > 0 ? `${Math.round((searches / pageViews) * 100)}%` : "INSUFFICIENT DATA",
      movieViewRate: searches > 0 ? `${Math.round((movieViews / searches) * 100)}%` : "INSUFFICIENT DATA",
      saveRate: movieViews > 0
        ? `${Math.round((countEvents(breakdown, ["watchlist_added", "favorite_added", "recommendation_saved"]) / movieViews) * 100)}%`
        : "INSUFFICIENT DATA",
      activationRate: retention.activationRate,
    },
    eventBreakdown: breakdown.sort((a, b) => b.count - a.count).slice(0, 30),
    registeredUsers,
    driver: isPostgres() ? "postgres" : "sqlite",
  };
}
