import "server-only";

import { getDatabase } from "@/lib/db/client";

const memory = new Map<string, { payload: string; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && mem.expiresAt > now) return JSON.parse(mem.payload) as T;
  if (mem) memory.delete(key);

  const db = await getDatabase();
  const row = await db.get<{ payload_json: string; expires_at: string }>(
    "SELECT payload_json, expires_at FROM cache_entries WHERE cache_key = ?",
    [key],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= now) {
    await db.run("DELETE FROM cache_entries WHERE cache_key = ?", [key]);
    return null;
  }
  const payload = typeof row.payload_json === "string" ? row.payload_json : JSON.stringify(row.payload_json);
  memory.set(key, { payload, expiresAt: new Date(row.expires_at).getTime() });
  return JSON.parse(payload) as T;
}

export async function cacheSet(key: string, value: unknown, ttlMs: number) {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const payload = JSON.stringify(value);
  memory.set(key, { payload, expiresAt: Date.now() + ttlMs });
  const db = await getDatabase();
  await db.run(
    `INSERT INTO cache_entries (cache_key, payload_json, expires_at, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, expires_at = excluded.expires_at`,
    [key, payload, expiresAt, new Date().toISOString()],
  );
}

export async function cacheDelete(key: string) {
  memory.delete(key);
  const db = await getDatabase();
  await db.run("DELETE FROM cache_entries WHERE cache_key = ?", [key]);
}

export async function cacheStats() {
  const db = await getDatabase();
  const row = await db.get<{ total: number; active: number }>(
    `SELECT COUNT(*) as total,
      SUM(CASE WHEN expires_at > ? THEN 1 ELSE 0 END) as active
     FROM cache_entries`,
    [new Date().toISOString()],
  );
  return { memoryEntries: memory.size, total: Number(row?.total ?? 0), active: Number(row?.active ?? 0) };
}
