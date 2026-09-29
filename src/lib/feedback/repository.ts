import "server-only";

import { getSessionUser } from "@/lib/auth/session";
import { getDatabase, isPostgres } from "@/lib/db/client";
import { DatabaseUnavailableError } from "@/lib/db/errors";
import { createSqliteDriver } from "@/lib/db/sqlite-driver";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CATEGORIES = new Set(["bug", "feature", "recommendation", "general"]);

export type FeedbackRecord = {
  id: string;
  userId: string | null;
  category: string;
  message: string;
  createdAt: string;
};

function feedbackFallbackPath(): string {
  if (process.env.VERCEL) return join(tmpdir(), "flutter-films-feedback.db");
  const dir = join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  return join(dir, "flutter-films-feedback.db");
}

async function saveWithDriver(
  driver: Awaited<ReturnType<typeof getDatabase>>,
  record: FeedbackRecord,
) {
  await driver.run(
    `INSERT INTO user_feedback (id, user_id, category, message, created_at) VALUES (?, ?, ?, ?, ?)`,
    [record.id, record.userId, record.category, record.message, record.createdAt],
  );
}

export async function saveUserFeedback(input: {
  category?: string;
  message: string;
}): Promise<{ id: string; storage: "primary" | "fallback" }> {
  const message = input.message.trim();
  if (message.length < 10) {
    throw new Error("Please provide at least 10 characters of feedback.");
  }

  const category = CATEGORIES.has(input.category ?? "") ? input.category! : "general";
  const user = await getSessionUser();
  const record: FeedbackRecord = {
    id: randomUUID(),
    userId: user?.id ?? null,
    category,
    message: message.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await getDatabase();
    await saveWithDriver(db, record);
    return { id: record.id, storage: "primary" };
  } catch (error) {
    if (!isPostgres() || !(error instanceof DatabaseUnavailableError)) throw error;
    const fallback = createSqliteDriver(feedbackFallbackPath());
    await saveWithDriver(fallback, record);
    await fallback.close();
    return { id: record.id, storage: "fallback" };
  }
}

export async function listRecentFeedback(limit = 50): Promise<FeedbackRecord[]> {
  const db = await getDatabase();
  const rows = await db.all<{
    id: string;
    user_id: string | null;
    category: string;
    message: string;
    created_at: string;
  }>(
    `SELECT id, user_id, category, message, created_at FROM user_feedback ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    category: row.category,
    message: row.message,
    createdAt: row.created_at,
  }));
}
