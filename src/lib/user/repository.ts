import "server-only";

import { getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

export type MemoryCategory =
  | "preferences"
  | "facts"
  | "dislikes"
  | "watching_habits"
  | "temporary_context"
  | "project_context";

export async function ensureUser(deviceId: string) {
  const db = await getDatabase();
  const existing = await db.get<{ id: string }>("SELECT id FROM users WHERE device_id = ?", [deviceId]);
  if (existing) return existing.id;

  const id = randomUUID();
  const now = new Date().toISOString();
  await db.run("INSERT INTO users (id, device_id, created_at, updated_at) VALUES (?, ?, ?, ?)", [id, deviceId, now, now]);
  await db.run(
    `INSERT INTO user_preferences (user_id, settings_json, updated_at)
     VALUES (?, '{}', ?)
     ON CONFLICT(user_id) DO NOTHING`,
    [id, now],
  );
  return id;
}

export async function saveWatchlist(userId: string, movieIds: number[]) {
  const db = await getDatabase();
  await db.run("DELETE FROM user_watchlist WHERE user_id = ?", [userId]);
  const now = new Date().toISOString();
  for (const [index, movieId] of movieIds.entries()) {
    await db.run(
      "INSERT INTO user_watchlist (user_id, movie_id, position, added_at) VALUES (?, ?, ?, ?)",
      [userId, movieId, index, now],
    );
  }
}

export async function getWatchlist(userId: string) {
  const db = await getDatabase();
  const rows = await db.all<{ movie_id: number }>(
    "SELECT movie_id FROM user_watchlist WHERE user_id = ? ORDER BY position ASC",
    [userId],
  );
  return rows.map((row) => row.movie_id);
}

export async function addAgentMemory(
  userId: string,
  category: MemoryCategory,
  content: string,
  source: "user" | "ai" | "system",
) {
  const db = await getDatabase();
  const id = randomUUID();
  await db.run(
    "INSERT INTO agent_memories (id, user_id, category, content, source, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, userId, category, content, source, new Date().toISOString()],
  );
  await db.run(
    "INSERT INTO agent_activity (id, user_id, kind, payload_json, created_at) VALUES (?, ?, 'memory_created', ?, ?)",
    [randomUUID(), userId, JSON.stringify({ category, memoryId: id }), new Date().toISOString()],
  );
  return id;
}

export async function listAgentMemories(userId: string, category?: MemoryCategory) {
  const db = await getDatabase();
  if (category) {
    return db.all(
      "SELECT * FROM agent_memories WHERE user_id = ? AND category = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [userId, category],
    );
  }
  return db.all(
    "SELECT * FROM agent_memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100",
    [userId],
  );
}

export async function deleteAgentMemory(userId: string, memoryId: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run("UPDATE agent_memories SET deleted_at = ? WHERE id = ? AND user_id = ?", [now, memoryId, userId]);
  await db.run(
    "INSERT INTO agent_activity (id, user_id, kind, payload_json, created_at) VALUES (?, ?, 'memory_removed', ?, ?)",
    [randomUUID(), userId, JSON.stringify({ memoryId }), now],
  );
}

export async function listAgentActivity(userId: string, limit = 30) {
  const db = await getDatabase();
  return db.all("SELECT * FROM agent_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, limit]);
}
