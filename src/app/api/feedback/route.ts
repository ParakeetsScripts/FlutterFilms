import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

const CATEGORIES = new Set(["bug", "feature", "recommendation", "general"]);

export async function POST(request: Request) {
  rateLimit(`feedback:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const body = (await request.json()) as { category?: string; message?: string };
    const message = body.message?.trim();
    if (!message || message.length < 10) throw new Error("Please provide at least 10 characters of feedback.");
    const category = CATEGORIES.has(body.category ?? "") ? body.category! : "general";
    const user = await getSessionUser();
    const db = await getDatabase();
    const id = randomUUID();
    await db.run(
      `INSERT INTO user_feedback (id, user_id, category, message, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, user?.id ?? null, category, message.slice(0, 2000), new Date().toISOString()],
    );
    return { ok: true, id };
  }, { route: "/api/feedback" });
}
