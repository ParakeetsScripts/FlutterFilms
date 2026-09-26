import "server-only";

import { getDatabase } from "@/lib/db/client";
import { hashPassword } from "./password";
import { randomUUID } from "node:crypto";

export async function createEmailUser(input: {
  email: string;
  password: string;
  displayName?: string;
  username?: string;
}) {
  const db = await getDatabase();
  const existing = await db.get("SELECT id FROM users WHERE email = ?", [input.email.toLowerCase()]);
  if (existing) throw new Error("An account with this email already exists.");

  const id = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);

  await db.run(
    `INSERT INTO users (id, email, password_hash, display_name, username, profile_visibility, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'private', ?, ?)`,
    [id, input.email.toLowerCase(), passwordHash, input.displayName ?? null, input.username ?? null, now, now],
  );
  await db.run(
    `INSERT INTO user_preferences (user_id, settings_json, updated_at) VALUES (?, '{}', ?)
     ON CONFLICT(user_id) DO NOTHING`,
    [id, now],
  );
  await db.run(
    `INSERT INTO profiles (id, user_id, bio, public_taste, created_at) VALUES (?, ?, NULL, 0, ?)
     ON CONFLICT(user_id) DO NOTHING`,
    [randomUUID(), id, now],
  );
  return id;
}

export async function findUserByEmail(email: string) {
  const db = await getDatabase();
  return db.get<{
    id: string;
    email: string;
    password_hash: string | null;
    display_name: string | null;
    email_verified_at: string | null;
  }>("SELECT id, email, password_hash, display_name, email_verified_at FROM users WHERE email = ?", [
    email.toLowerCase(),
  ]);
}

export async function findOrCreateOAuthUser(input: {
  provider: string;
  providerAccountId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  const db = await getDatabase();
  const linked = await db.get<{ user_id: string }>(
    "SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?",
    [input.provider, input.providerAccountId],
  );
  if (linked) return linked.user_id;

  const existing = await db.get<{ id: string }>("SELECT id FROM users WHERE email = ?", [input.email.toLowerCase()]);
  const userId = existing?.id ?? randomUUID();
  const now = new Date().toISOString();

  if (!existing) {
    await db.run(
      `INSERT INTO users (id, email, display_name, avatar_url, email_verified_at, profile_visibility, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'private', ?, ?)`,
      [userId, input.email.toLowerCase(), input.displayName ?? null, input.avatarUrl ?? null, now, now, now],
    );
    await db.run(`INSERT INTO user_preferences (user_id, settings_json, updated_at) VALUES (?, '{}', ?)`, [userId, now]);
    await db.run(`INSERT INTO profiles (id, user_id, public_taste, created_at) VALUES (?, ?, 0, ?)`, [
      randomUUID(),
      userId,
      now,
    ]);
  }

  await db.run(
    `INSERT INTO oauth_accounts (provider, provider_account_id, user_id, email, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(provider, provider_account_id) DO UPDATE SET user_id = excluded.user_id`,
    [input.provider, input.providerAccountId, userId, input.email.toLowerCase(), now],
  );

  return userId;
}

export async function updatePassword(userId: string, passwordHash: string) {
  const db = await getDatabase();
  await db.run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [
    passwordHash,
    new Date().toISOString(),
    userId,
  ]);
}

export async function markEmailVerified(userId: string) {
  const db = await getDatabase();
  await db.run("UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?", [
    new Date().toISOString(),
    new Date().toISOString(),
    userId,
  ]);
}

export async function deleteUserAccount(userId: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM users WHERE id = ?", [userId]);
}
