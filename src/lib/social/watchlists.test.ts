import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSqliteDriver } from "@/lib/db/sqlite-driver";
import {
  addToSharedWatchlist,
  createSharedWatchlist,
  getSharedWatchlist,
  removeFromSharedWatchlist,
} from "@/lib/social/watchlists";
import { randomUUID } from "node:crypto";

describe("shared watchlists", () => {
  let tmp = "";
  let db: ReturnType<typeof createSqliteDriver> | null = null;
  const ownerId = randomUUID();
  const editorId = randomUUID();
  const viewerId = randomUUID();

  afterEach(async () => {
    await db?.close();
    db = null;
    if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp);
    delete process.env.DATABASE_URL;
  });

  async function seedUsers() {
    const now = new Date().toISOString();
    for (const id of [ownerId, editorId, viewerId]) {
      await db!.run(
        `INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [id, id.slice(0, 8), now, now],
      );
    }
  }

  async function addMember(watchlistId: string, userId: string, role: string) {
    await db!.run(
      `INSERT INTO shared_watchlist_members (watchlist_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)`,
      [watchlistId, userId, role, new Date().toISOString()],
    );
  }

  it("enforces permissions between owner, editor, and viewer", async () => {
    tmp = path.join(os.tmpdir(), `ff-watchlist-${Date.now()}.db`);
    process.env.DATABASE_URL = tmp;
    db = createSqliteDriver();
    await seedUsers();

    const list = await createSharedWatchlist(ownerId, "Test list");
    await addMember(list.id, editorId, "editor");
    await addMember(list.id, viewerId, "viewer");

    await addToSharedWatchlist(list.id, editorId, 550);
    const detail = await getSharedWatchlist(list.id, ownerId);
    expect(detail?.items).toHaveLength(1);

    await expect(addToSharedWatchlist(list.id, viewerId, 551)).rejects.toThrow(/permissions/i);
    await removeFromSharedWatchlist(list.id, editorId, 550);
    const afterRemove = await getSharedWatchlist(list.id, ownerId);
    expect(afterRemove?.items).toHaveLength(0);
  });
});
