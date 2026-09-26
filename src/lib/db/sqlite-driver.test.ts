import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSqliteDriver } from "./sqlite-driver";

describe("sqlite driver", () => {
  let tmp = "";
  let db: ReturnType<typeof createSqliteDriver> | null = null;

  afterEach(async () => {
    await db?.close();
    db = null;
    if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp);
    delete process.env.DATABASE_URL;
  });

  it("creates schema and inserts a movie row", async () => {
    tmp = path.join(os.tmpdir(), `ff-test-${Date.now()}.db`);
    process.env.DATABASE_URL = tmp;
    db = createSqliteDriver();
    await db.run(
      `INSERT INTO movies (tmdb_id, title, payload_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [42, "Test", "{}", new Date().toISOString(), new Date().toISOString()],
    );
    const row = await db.get<{ title: string }>("SELECT title FROM movies WHERE tmdb_id = ?", [42]);
    expect(row?.title).toBe("Test");
  });
});
