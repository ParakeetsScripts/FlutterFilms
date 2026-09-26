import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/client";

export const SESSION_COOKIE = "ff_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  profileVisibility: "private" | "friends" | "public";
};

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const db = await getDatabase();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.run(
    `INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sessionId, userId, tokenHash, expiresAt, meta?.userAgent ?? null, meta?.ip ?? null],
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return { sessionId, token };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDatabase();
    await db.run("DELETE FROM auth_sessions WHERE token_hash = ?", [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDatabase();
  const row = await db.get<{
    user_id: string;
    email: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email_verified_at: string | null;
    profile_visibility: string;
    expires_at: string;
    token_hash: string;
  }>(
    `SELECT s.user_id, s.expires_at, s.token_hash, u.email, u.display_name, u.username, u.avatar_url,
            u.email_verified_at, u.profile_visibility
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`,
    [hashToken(token)],
  );

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.run("DELETE FROM auth_sessions WHERE token_hash = ?", [hashToken(token)]);
    return null;
  }

  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url,
    emailVerified: Boolean(row.email_verified_at),
    profileVisibility: (row.profile_visibility as SessionUser["profileVisibility"]) ?? "private",
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    const { AuthError } = await import("./errors");
    throw new AuthError("Authentication required.");
  }
  return user;
}
