import "server-only";

import { getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

export type ErrorCategory =
  | "auth"
  | "validation"
  | "database"
  | "external_api"
  | "ai"
  | "unknown";

export async function reportProductionError(input: {
  route?: string;
  feature?: string;
  category: ErrorCategory;
  message: string;
  requestId?: string;
  userId?: string | null;
}) {
  const id = input.requestId ?? randomUUID();
  const now = new Date().toISOString();
  const safeMessage = input.message.slice(0, 500);
  try {
    const db = await getDatabase();
    await db.run(
      `INSERT INTO product_errors_log (id, request_id, route, feature, category, message, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), id, input.route ?? null, input.feature ?? null, input.category, safeMessage, input.userId ?? null, now],
    );
  } catch {
    console.error(JSON.stringify({ requestId: id, category: input.category, route: input.route, message: safeMessage }));
  }
  return id;
}

export function errorCategoryFromError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    if (/auth|session|unauthorized/i.test(error.message)) return "auth";
    if (/validation|invalid|required/i.test(error.message)) return "validation";
    if (/database|sqlite|postgres/i.test(error.message)) return "database";
    if (/tmdb|imdb|provider/i.test(error.message)) return "external_api";
    if (/ai|model|ollama|openai/i.test(error.message)) return "ai";
  }
  return "unknown";
}
