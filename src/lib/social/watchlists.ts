import "server-only";

import { findUserByEmail } from "@/lib/auth/repository";
import { getDatabase } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

export type WatchlistRole = "owner" | "editor" | "viewer";

async function logActivity(
  watchlistId: string,
  userId: string | null,
  action: string,
  movieId?: number,
  detail?: Record<string, unknown>,
) {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO watchlist_activity (id, watchlist_id, user_id, action, movie_id, detail_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), watchlistId, userId, action, movieId ?? null, detail ? JSON.stringify(detail) : null, new Date().toISOString()],
  );
}

async function requireRole(watchlistId: string, userId: string, minRole: WatchlistRole) {
  const db = await getDatabase();
  const access = await db.get<{ role: string }>(
    "SELECT role FROM shared_watchlist_members WHERE watchlist_id = ? AND user_id = ?",
    [watchlistId, userId],
  );
  if (!access) throw new Error("Access denied.");
  const order = { owner: 3, editor: 2, viewer: 1 };
  if (order[access.role as WatchlistRole] < order[minRole]) throw new Error("Insufficient permissions.");
  return access.role as WatchlistRole;
}

export async function createSharedWatchlist(ownerId: string, title: string, visibility = "private") {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO shared_watchlists (id, owner_id, title, visibility, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, ownerId, title, visibility, now],
  );
  await db.run(
    `INSERT INTO shared_watchlist_members (watchlist_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)`,
    [id, ownerId, now],
  );
  await logActivity(id, ownerId, "list_created", undefined, { title });
  return { id, title };
}

export async function renameSharedWatchlist(watchlistId: string, userId: string, title: string) {
  await requireRole(watchlistId, userId, "owner");
  const db = await getDatabase();
  await db.run("UPDATE shared_watchlists SET title = ? WHERE id = ?", [title, watchlistId]);
  await logActivity(watchlistId, userId, "list_renamed", undefined, { title });
}

export async function deleteSharedWatchlist(watchlistId: string, userId: string) {
  await requireRole(watchlistId, userId, "owner");
  const db = await getDatabase();
  await db.run("DELETE FROM shared_watchlist_items WHERE watchlist_id = ?", [watchlistId]);
  await db.run("DELETE FROM shared_watchlist_members WHERE watchlist_id = ?", [watchlistId]);
  await db.run("DELETE FROM watchlist_activity WHERE watchlist_id = ?", [watchlistId]);
  await db.run("DELETE FROM shared_watchlists WHERE id = ?", [watchlistId]);
}

export async function leaveSharedWatchlist(watchlistId: string, userId: string) {
  const role = await requireRole(watchlistId, userId, "viewer");
  if (role === "owner") throw new Error("Owner cannot leave — transfer ownership or delete the list.");
  const db = await getDatabase();
  await db.run("DELETE FROM shared_watchlist_members WHERE watchlist_id = ? AND user_id = ?", [watchlistId, userId]);
  await logActivity(watchlistId, userId, "member_left");
}

export async function inviteToWatchlist(watchlistId: string, inviterId: string, email: string, role: WatchlistRole = "editor") {
  await requireRole(watchlistId, inviterId, "owner");
  if (role === "owner") throw new Error("Cannot invite as owner.");
  const user = await findUserByEmail(email);
  if (!user) throw new Error("No user found with that email.");
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO shared_watchlist_members (watchlist_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(watchlist_id, user_id) DO UPDATE SET role = excluded.role`,
    [watchlistId, user.id, role, now],
  );
  await logActivity(watchlistId, inviterId, "member_invited", undefined, { email, role });
}

export async function updateMemberRole(watchlistId: string, ownerId: string, memberId: string, role: WatchlistRole) {
  await requireRole(watchlistId, ownerId, "owner");
  if (role === "owner") throw new Error("Use transfer ownership instead.");
  const db = await getDatabase();
  await db.run(
    "UPDATE shared_watchlist_members SET role = ? WHERE watchlist_id = ? AND user_id = ?",
    [role, watchlistId, memberId],
  );
  await logActivity(watchlistId, ownerId, "role_changed", undefined, { memberId, role });
}

export async function removeMember(watchlistId: string, ownerId: string, memberId: string) {
  await requireRole(watchlistId, ownerId, "owner");
  const db = await getDatabase();
  await db.run("DELETE FROM shared_watchlist_members WHERE watchlist_id = ? AND user_id = ?", [watchlistId, memberId]);
  await logActivity(watchlistId, ownerId, "member_removed", undefined, { memberId });
}

export async function getSharedWatchlist(id: string, userId: string) {
  const db = await getDatabase();
  const list = await db.get<{ id: string; title: string; owner_id: string; visibility: string }>(
    "SELECT id, title, owner_id, visibility FROM shared_watchlists WHERE id = ?",
    [id],
  );
  if (!list) return null;

  const member = await db.get<{ role: string }>(
    "SELECT role FROM shared_watchlist_members WHERE watchlist_id = ? AND user_id = ?",
    [id, userId],
  );
  if (!member) return null;

  const items = await db.all<{ movie_id: number; added_by: string | null; position: number; added_at: string }>(
    "SELECT movie_id, added_by, position, added_at FROM shared_watchlist_items WHERE watchlist_id = ? ORDER BY position",
    [id],
  );
  const members = await db.all<{ user_id: string; role: string; display_name: string | null }>(
    `SELECT m.user_id, m.role, u.display_name
     FROM shared_watchlist_members m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.watchlist_id = ?`,
    [id],
  );
  const activity = await db.all<{ id: string; user_id: string | null; action: string; movie_id: number | null; detail_json: string | null; created_at: string; display_name: string | null }>(
    `SELECT a.id, a.user_id, a.action, a.movie_id, a.detail_json, a.created_at, u.display_name
     FROM watchlist_activity a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.watchlist_id = ?
     ORDER BY a.created_at DESC LIMIT 30`,
    [id],
  );

  return { ...list, role: member.role as WatchlistRole, items, members, activity };
}

export async function addToSharedWatchlist(watchlistId: string, userId: string, movieId: number) {
  await requireRole(watchlistId, userId, "editor");
  const db = await getDatabase();
  const count = await db.get<{ c: number }>(
    "SELECT COUNT(*) AS c FROM shared_watchlist_items WHERE watchlist_id = ?",
    [watchlistId],
  );
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO shared_watchlist_items (watchlist_id, movie_id, added_by, position, added_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(watchlist_id, movie_id) DO NOTHING`,
    [watchlistId, movieId, userId, Number(count?.c ?? 0), now],
  );
  await logActivity(watchlistId, userId, "movie_added", movieId);
}

export async function removeFromSharedWatchlist(watchlistId: string, userId: string, movieId: number) {
  await requireRole(watchlistId, userId, "editor");
  const db = await getDatabase();
  await db.run("DELETE FROM shared_watchlist_items WHERE watchlist_id = ? AND movie_id = ?", [watchlistId, movieId]);
  await logActivity(watchlistId, userId, "movie_removed", movieId);
}

export async function reorderSharedWatchlist(watchlistId: string, userId: string, movieIds: number[]) {
  await requireRole(watchlistId, userId, "editor");
  const db = await getDatabase();
  for (let i = 0; i < movieIds.length; i++) {
    await db.run(
      "UPDATE shared_watchlist_items SET position = ? WHERE watchlist_id = ? AND movie_id = ?",
      [i, watchlistId, movieIds[i]],
    );
  }
  await logActivity(watchlistId, userId, "list_reordered");
}

export async function listUserSharedWatchlists(userId: string) {
  const db = await getDatabase();
  return db.all(
    `SELECT w.id, w.title, w.visibility, m.role,
            (SELECT COUNT(*) FROM shared_watchlist_items i WHERE i.watchlist_id = w.id) AS movie_count
     FROM shared_watchlists w
     JOIN shared_watchlist_members m ON m.watchlist_id = w.id
     WHERE m.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId],
  );
}
