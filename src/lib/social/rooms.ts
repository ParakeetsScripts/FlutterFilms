import "server-only";

import { getDatabase } from "@/lib/db/client";
import { randomBytes, randomUUID } from "node:crypto";

function shareCode() {
  return randomBytes(4).toString("hex");
}

export type SpoilerLevel = "none" | "light" | "moderate" | "full";

export async function createRoom(ownerId: string, title: string, spoilerLevel: SpoilerLevel = "none") {
  const db = await getDatabase();
  const id = randomUUID();
  const code = shareCode();
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.run(
    `INSERT INTO movie_rooms (id, owner_id, title, share_code, status, preferences_json, created_at, expires_at, spoiler_level, voting_round)
     VALUES (?, ?, ?, ?, 'open', '{}', ?, ?, ?, 1)`,
    [id, ownerId, title, code, now, expires, spoilerLevel],
  );
  await db.run(
    `INSERT INTO movie_room_participants (room_id, user_id, guest_name, preferences_json, joined_at) VALUES (?, ?, NULL, '{}', ?)`,
    [id, ownerId, now],
  );
  return { id, shareCode: code };
}

export async function joinRoom(
  roomId: string,
  userId: string | null,
  guestName: string | null,
  preferences: Record<string, unknown>,
) {
  const db = await getDatabase();
  const participantId = userId ?? `guest:${randomUUID()}`;
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO movie_room_participants (room_id, user_id, guest_name, preferences_json, joined_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(room_id, user_id) DO UPDATE SET preferences_json = excluded.preferences_json, guest_name = COALESCE(excluded.guest_name, movie_room_participants.guest_name)`,
    [roomId, participantId, guestName, JSON.stringify(preferences), now],
  );
  return { participantId };
}

export async function leaveRoom(roomId: string, userId: string) {
  const db = await getDatabase();
  await db.run("DELETE FROM movie_room_participants WHERE room_id = ? AND user_id = ?", [roomId, userId]);
  await db.run("DELETE FROM room_votes WHERE room_id = ? AND voter_id = ?", [roomId, userId]);
}

export async function saveRoomPreferences(roomId: string, userId: string, preferences: Record<string, unknown>) {
  const db = await getDatabase();
  await db.run(
    "UPDATE movie_room_participants SET preferences_json = ? WHERE room_id = ? AND user_id = ?",
    [JSON.stringify(preferences), roomId, userId],
  );
}

export async function addRoomCandidate(roomId: string, userId: string, movieId: number) {
  const db = await getDatabase();
  const count = await db.get<{ c: number }>("SELECT COUNT(*) AS c FROM room_candidates WHERE room_id = ?", [roomId]);
  await db.run(
    `INSERT INTO room_candidates (room_id, movie_id, added_by, position, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(room_id, movie_id) DO NOTHING`,
    [roomId, movieId, userId, Number(count?.c ?? 0), new Date().toISOString()],
  );
}

export async function getRoomByCode(code: string) {
  const db = await getDatabase();
  const room = await db.get<{
    id: string;
    title: string;
    owner_id: string;
    status: string;
    spoiler_level: string;
    locked_movie_id: number | null;
    voting_round: number;
    result_json: string | null;
    expires_at: string | null;
  }>(
    `SELECT id, title, owner_id, status, spoiler_level, locked_movie_id, voting_round, result_json, expires_at
     FROM movie_rooms WHERE share_code = ?`,
    [code],
  );
  if (!room) return null;
  if (room.expires_at && new Date(room.expires_at) < new Date()) return null;

  const participants = await db.all<{
    user_id: string | null;
    guest_name: string | null;
    preferences_json: string;
  }>(
    "SELECT user_id, guest_name, preferences_json FROM movie_room_participants WHERE room_id = ?",
    [room.id],
  );
  const candidates = await db.all<{ movie_id: number; added_by: string | null; position: number }>(
    "SELECT movie_id, added_by, position FROM room_candidates WHERE room_id = ? ORDER BY position",
    [room.id],
  );
  const votes = await getRoomVotes(room.id);

  return {
    ...room,
    participants,
    candidates,
    votes,
    shareUrl: `/rooms/${code}`,
  };
}

export async function voteInRoom(roomId: string, voterId: string, movieId: number) {
  const db = await getDatabase();
  const room = await db.get<{ status: string; locked_movie_id: number | null }>(
    "SELECT status, locked_movie_id FROM movie_rooms WHERE id = ?",
    [roomId],
  );
  if (!room || room.status !== "open" || room.locked_movie_id) throw new Error("Voting is closed.");

  await db.run(
    `INSERT INTO room_votes (room_id, voter_id, movie_id, vote, created_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(room_id, voter_id, movie_id) DO UPDATE SET vote = 1`,
    [roomId, voterId, movieId, new Date().toISOString()],
  );
}

export async function removeVote(roomId: string, voterId: string, movieId: number) {
  const db = await getDatabase();
  await db.run("DELETE FROM room_votes WHERE room_id = ? AND voter_id = ? AND movie_id = ?", [roomId, voterId, movieId]);
}

export async function getRoomVotes(roomId: string) {
  const db = await getDatabase();
  return db.all<{ movie_id: number; votes: number }>(
    `SELECT movie_id, SUM(vote) AS votes FROM room_votes WHERE room_id = ? GROUP BY movie_id ORDER BY votes DESC`,
    [roomId],
  );
}

export async function lockRoomChoice(roomId: string, ownerId: string, movieId: number) {
  const db = await getDatabase();
  const room = await db.get<{ owner_id: string }>("SELECT owner_id FROM movie_rooms WHERE id = ?", [roomId]);
  if (!room || room.owner_id !== ownerId) throw new Error("Only the owner can lock the choice.");
  await db.run("UPDATE movie_rooms SET locked_movie_id = ?, status = 'locked' WHERE id = ?", [movieId, roomId]);
}

export async function restartRoomVoting(roomId: string, ownerId: string) {
  const db = await getDatabase();
  const room = await db.get<{ owner_id: string; voting_round: number }>(
    "SELECT owner_id, voting_round FROM movie_rooms WHERE id = ?",
    [roomId],
  );
  if (!room || room.owner_id !== ownerId) throw new Error("Only the owner can restart voting.");
  const db2 = await getDatabase();
  await db2.run("DELETE FROM room_votes WHERE room_id = ?", [roomId]);
  await db2.run(
    "UPDATE movie_rooms SET locked_movie_id = NULL, status = 'open', voting_round = ?, result_json = NULL WHERE id = ?",
    [Number(room.voting_round) + 1, roomId],
  );
}

export async function setRoomResult(roomId: string, result: Record<string, unknown>) {
  const db = await getDatabase();
  await db.run("UPDATE movie_rooms SET result_json = ? WHERE id = ?", [JSON.stringify(result), roomId]);
}

export async function closeRoom(roomId: string, ownerId: string) {
  const db = await getDatabase();
  const room = await db.get<{ owner_id: string }>("SELECT owner_id FROM movie_rooms WHERE id = ?", [roomId]);
  if (!room || room.owner_id !== ownerId) throw new Error("Only the owner can close this room.");
  await db.run("UPDATE movie_rooms SET status = 'closed' WHERE id = ?", [roomId]);
}

export async function listUserRooms(userId: string) {
  const db = await getDatabase();
  return db.all<{ id: string; title: string; share_code: string; status: string }>(
    `SELECT id, title, share_code, status FROM movie_rooms WHERE owner_id = ? ORDER BY created_at DESC LIMIT 20`,
    [userId],
  );
}
