import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthToken(userId: string, kind: "email_verify" | "password_reset", hours = 24) {
  const db = await getDatabase();
  const token = randomBytes(32).toString("base64url");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  await db.run(
    `INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, kind, hashToken(token), expiresAt],
  );
  return token;
}

export async function consumeAuthToken(token: string, kind: "email_verify" | "password_reset") {
  const db = await getDatabase();
  const row = await db.get<{ id: string; user_id: string; expires_at: string }>(
    "SELECT id, user_id, expires_at FROM auth_tokens WHERE token_hash = ? AND kind = ?",
    [hashToken(token), kind],
  );
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
  await db.run("DELETE FROM auth_tokens WHERE id = ?", [row.id]);
  return row.user_id;
}
