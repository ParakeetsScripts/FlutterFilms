import "server-only";

import type { DatabaseDriver } from "./driver";
import { createPostgresDriver } from "./postgres-driver";
import { createSqliteDriver } from "./sqlite-driver";

let driver: DatabaseDriver | null = null;

export function isPostgres(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres");
}

/** Bind boolean columns for the active driver (Postgres BOOLEAN vs SQLite INTEGER). */
export function boolParam(value: boolean): boolean | number {
  return isPostgres() ? value : value ? 1 : 0;
}

export async function getDatabase(): Promise<DatabaseDriver> {
  if (driver) return driver;
  driver = isPostgres() ? createPostgresDriver() : createSqliteDriver();
  return driver;
}

export async function closeDb() {
  await driver?.close();
  driver = null;
}
