import "server-only";

import { getDatabase } from "@/lib/db/client";
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
    paused ? 1 : 0,
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
