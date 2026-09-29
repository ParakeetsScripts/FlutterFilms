import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseDriver, QueryResult } from "./driver";
import {
  MIGRATIONS,
  MIGRATIONS_V10,
  MIGRATIONS_V11,
  MIGRATIONS_V2,
  MIGRATIONS_V3,
  MIGRATIONS_V4,
  MIGRATIONS_V5,
  MIGRATIONS_V6,
  MIGRATIONS_V7,
  MIGRATIONS_V8,
  MIGRATIONS_V9,
  SCHEMA_VERSION,
} from "./schema";

function sqlitePath(): string {
  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured.slice("file:".length);
  if (configured && !configured.startsWith("postgres")) return configured;
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "flutter-films.db");
}

export function createSqliteDriver(filePath?: string): DatabaseDriver {
  const db = new Database(filePath ?? sqlitePath());
  db.pragma("journal_mode = WAL");
  db.exec(MIGRATIONS);
  let row = db.prepare("SELECT version FROM schema_meta LIMIT 1").get() as { version: number } | undefined;
  let version = row?.version ?? 0;
  if (!row) {
    db.prepare("INSERT INTO schema_meta (version) VALUES (?)").run(1);
    version = 1;
  }
  if (version < 2) {
    db.exec(MIGRATIONS_V2);
    db.prepare("UPDATE schema_meta SET version = ?").run(2);
    version = 2;
  }
  if (version < 3) {
    for (const statement of MIGRATIONS_V3.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* column exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(3);
    version = 3;
  }
  if (version < 4) {
    for (const statement of MIGRATIONS_V4.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* column exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(4);
    version = 4;
  }
  if (version < 5) {
    for (const statement of MIGRATIONS_V5.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(5);
    version = 5;
  }
  if (version < 6) {
    for (const statement of MIGRATIONS_V6.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(6);
    version = 6;
  }
  if (version < 7) {
    for (const statement of MIGRATIONS_V7.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(7);
    version = 7;
  }
  if (version < 8) {
    for (const statement of MIGRATIONS_V8.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(8);
    version = 8;
  }
  if (version < 9) {
    for (const statement of MIGRATIONS_V9.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(9);
    version = 9;
  }
  if (version < 10) {
    for (const statement of MIGRATIONS_V10.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(10);
    version = 10;
  }
  if (version < SCHEMA_VERSION) {
    for (const statement of MIGRATIONS_V11.split(";").map((s) => s.trim()).filter(Boolean)) {
      try { db.exec(`${statement};`); } catch { /* exists */ }
    }
    db.prepare("UPDATE schema_meta SET version = ?").run(SCHEMA_VERSION);
  }

  return {
    kind: "sqlite",
    async get<T>(sql: string, params: unknown[] = []) {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async all<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async run(sql: string, params: unknown[] = []) {
      const result = db.prepare(sql).run(...params);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid } satisfies QueryResult;
    },
    async exec(sql: string) {
      db.exec(sql);
    },
    async close() {
      db.close();
    },
  };
}
