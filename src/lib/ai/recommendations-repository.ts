import "server-only";

import { getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

export type RecommendationFeedback =
  | "more_like_this"
  | "less_like_this"
  | "not_interested"
  | "already_watched"
  | "wrong_mood";

export async function recordRecommendationEvent(input: {
  userId?: string;
  movieId: number;
  reason?: string;
  modelId?: string;
  signals?: Record<string, unknown>;
}) {
  const db = await getDatabase();
  const id = randomUUID();
  await db.run(
    `INSERT INTO recommendation_events (id, user_id, movie_id, reason, model_id, signals_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId ?? null,
      input.movieId,
      input.reason ?? null,
      input.modelId ?? null,
      input.signals ? JSON.stringify(input.signals) : null,
      new Date().toISOString(),
    ],
  );
  return id;
}

export async function recordRecommendationFeedback(input: {
  userId?: string;
  eventId?: string;
  movieId: number;
  feedback: RecommendationFeedback;
}) {
  const db = await getDatabase();
  const id = randomUUID();
  await db.run(
    `INSERT INTO recommendation_feedback (id, event_id, user_id, movie_id, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.eventId ?? null, input.userId ?? null, input.movieId, input.feedback, new Date().toISOString()],
  );
}

export async function listRecommendationFeedback(userId: string, limit = 100) {
  const db = await getDatabase();
  const rows = await db.all<{ movie_id: number; feedback: string }>(
    "SELECT movie_id, feedback FROM recommendation_feedback WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map((r) => ({ movieId: r.movie_id, feedback: r.feedback }));
}

export async function listNegativeFeedbackMovieIds(userId: string): Promise<number[]> {
  const rows = await listRecommendationFeedback(userId, 200);
  return rows
    .filter((r) => r.feedback === "less_like_this" || r.feedback === "not_interested")
    .map((r) => r.movieId);
}

export async function markRecommendationEngagement(
  eventId: string,
  field: "clicked" | "saved" | "watched" | "dismissed",
) {
  const db = await getDatabase();
  await db.run(`UPDATE recommendation_events SET ${field} = TRUE WHERE id = ?`, [eventId]);
}
