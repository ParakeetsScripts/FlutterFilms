import "server-only";

import { getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

export type GenerationKind = "image" | "video" | "poster" | "movie_night_card" | "creative_concept";

export async function createGenerationJob(input: {
  userId?: string;
  kind: GenerationKind;
  providerId?: string;
  modelId?: string;
  local?: boolean;
  prompt?: string;
  input?: Record<string, unknown>;
}) {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO generation_jobs (id, user_id, kind, provider_id, model_id, status, local, prompt, input_json, progress, created_at)
     VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?, 0, ?)`,
    [
      id,
      input.userId ?? null,
      input.kind,
      input.providerId ?? null,
      input.modelId ?? null,
      input.local ? 1 : 0,
      input.prompt ?? null,
      input.input ? JSON.stringify(input.input) : null,
      now,
    ],
  );
  return id;
}

export async function updateGenerationJob(
  id: string,
  patch: {
    status?: string;
    progress?: number;
    outputUrl?: string;
    output?: Record<string, unknown>;
    error?: string;
    creditsUsed?: number;
  },
) {
  const db = await getDatabase();
  const completed = patch.status === "completed" || patch.status === "failed";
  await db.run(
    `UPDATE generation_jobs SET
      status = COALESCE(?, status),
      progress = COALESCE(?, progress),
      output_url = COALESCE(?, output_url),
      output_json = COALESCE(?, output_json),
      error = COALESCE(?, error),
      credits_used = COALESCE(?, credits_used),
      completed_at = CASE WHEN ? THEN ? ELSE completed_at END
     WHERE id = ?`,
    [
      patch.status ?? null,
      patch.progress ?? null,
      patch.outputUrl ?? null,
      patch.output ? JSON.stringify(patch.output) : null,
      patch.error ?? null,
      patch.creditsUsed ?? null,
      completed,
      completed ? new Date().toISOString() : null,
      id,
    ],
  );
}

export async function listGenerationJobs(userId?: string, limit = 20) {
  const db = await getDatabase();
  if (userId) {
    return db.all("SELECT * FROM generation_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", [userId, limit]);
  }
  return db.all("SELECT * FROM generation_jobs ORDER BY created_at DESC LIMIT ?", [limit]);
}
