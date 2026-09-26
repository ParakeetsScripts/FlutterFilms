import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSqliteDriver } from "@/lib/db/sqlite-driver";
import { createRoom, getRoomByCode, joinRoom, voteInRoom, getRoomVotes } from "@/lib/social/rooms";
import { randomUUID } from "node:crypto";

describe("movie rooms", () => {
  let tmp = "";
  let db: ReturnType<typeof createSqliteDriver> | null = null;
  const ownerId = randomUUID();

  afterEach(async () => {
    await db?.close();
    db = null;
    if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp);
    delete process.env.DATABASE_URL;
  });

  it("creates room, joins, and records votes", async () => {
    tmp = path.join(os.tmpdir(), `ff-room-${Date.now()}.db`);
    process.env.DATABASE_URL = tmp;
    db = createSqliteDriver();
    for (const sql of [
      "ALTER TABLE movie_rooms ADD COLUMN share_code TEXT",
      "ALTER TABLE movie_rooms ADD COLUMN preferences_json TEXT DEFAULT '{}'",
      "ALTER TABLE movie_rooms ADD COLUMN expires_at TEXT",
      "ALTER TABLE movie_rooms ADD COLUMN spoiler_level TEXT DEFAULT 'none'",
      "ALTER TABLE movie_rooms ADD COLUMN locked_movie_id INTEGER",
      "ALTER TABLE movie_rooms ADD COLUMN voting_round INTEGER DEFAULT 1",
      "ALTER TABLE movie_rooms ADD COLUMN result_json TEXT",
    ]) {
      try {
        await db.exec(sql);
      } catch {
        /* column exists */
      }
    }
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, 'Host', ?, ?)`,
      [ownerId, now, now],
    );

    const room = await createRoom(ownerId, "Friday night");
    const loaded = await getRoomByCode(room.shareCode);
    expect(loaded?.title).toBe("Friday night");

    const guest = await joinRoom(loaded!.id, null, "Alex", { mood: "fun" });
    await voteInRoom(loaded!.id, guest.participantId, 550);
    const votes = await getRoomVotes(loaded!.id);
    expect(votes[0]?.movie_id).toBe(550);
    expect(votes[0]?.votes).toBe(1);
  });
});
