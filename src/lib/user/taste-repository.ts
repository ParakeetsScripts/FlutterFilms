import "server-only";

import { boolParam, getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

export type TasteSignal = {
  signalKey: string;
  signalValue: string;
  weight: number;
  source: string;
};

export async function upsertTasteSignal(userId: string, signal: TasteSignal) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO taste_signals (id, user_id, signal_key, signal_value, weight, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, signal_key, signal_value) DO UPDATE SET
       weight = taste_signals.weight + excluded.weight,
       updated_at = excluded.updated_at`,
    [randomUUID(), userId, signal.signalKey, signal.signalValue, signal.weight, signal.source, now, now],
  );
}

export async function listTasteSignals(userId: string): Promise<TasteSignal[]> {
  const db = await getDatabase();
  const rows = await db.all<{
    signal_key: string;
    signal_value: string;
    weight: number;
    source: string;
  }>("SELECT signal_key, signal_value, weight, source FROM taste_signals WHERE user_id = ? ORDER BY weight DESC", [
    userId,
  ]);
  return rows.map((r) => ({
    signalKey: r.signal_key,
    signalValue: r.signal_value,
    weight: r.weight,
    source: r.source,
  }));
}

export async function deleteTasteSignal(userId: string, signalKey: string, signalValue: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM taste_signals WHERE user_id = ? AND signal_key = ? AND signal_value = ?", [
    userId,
    signalKey,
    signalValue,
  ]);
}

export async function resetTasteSignals(userId: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM taste_signals WHERE user_id = ?", [userId]);
  await db.run("DELETE FROM taste_snapshots WHERE user_id = ?", [userId]);
}

export async function setTasteLearningPaused(userId: string, paused: boolean) {
  const db = await getDatabase();
  await db.run("UPDATE users SET taste_learning_paused = ?, updated_at = ? WHERE id = ?", [
    boolParam(paused),
    new Date().toISOString(),
    userId,
  ]);
}

export async function saveTasteSnapshot(userId: string, dna: Record<string, unknown>) {
  const db = await getDatabase();
  await db.run("INSERT INTO taste_snapshots (id, user_id, dna_json, created_at) VALUES (?, ?, ?, ?)", [
    randomUUID(),
    userId,
    JSON.stringify(dna),
    new Date().toISOString(),
  ]);
}

export async function listTasteSnapshots(userId: string, limit = 12) {
  const db = await getDatabase();
  const rows = await db.all<{ dna_json: string; created_at: string }>(
    "SELECT dna_json, created_at FROM taste_snapshots WHERE user_id = ? ORDER BY created_at ASC LIMIT ?",
    [userId, limit],
  );
  return rows.map((row) => ({
    createdAt: row.created_at,
    dna: JSON.parse(row.dna_json) as Record<string, unknown>,
  }));
}

export type PostReflectionInput = {
  liked?: string;
  disliked?: string;
  rating?: number;
  mood?: string;
  wouldRewatch?: boolean;
  wouldRecommend?: boolean;
  favoriteElement?: string;
};

export async function savePostReflection(userId: string, movieId: number, reflection: PostReflectionInput) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO taste_signals (id, user_id, signal_key, signal_value, weight, source, created_at, updated_at)
     VALUES (?, ?, 'reflection', ?, 1, 'post_reflection', ?, ?)
     ON CONFLICT(user_id, signal_key, signal_value) DO UPDATE SET updated_at = excluded.updated_at`,
    [randomUUID(), userId, JSON.stringify({ movieId, ...reflection }), now, now],
  );

  if (reflection.mood) {
    await upsertTasteSignal(userId, {
      signalKey: "reflection_mood",
      signalValue: reflection.mood,
      weight: 1,
      source: "post_reflection",
    });
  }
  if (reflection.wouldRewatch) {
    await upsertTasteSignal(userId, {
      signalKey: "rewatch_intent",
      signalValue: String(movieId),
      weight: 2,
      source: "post_reflection",
    });
  }
}
