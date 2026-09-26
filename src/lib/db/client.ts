import "server-only";

import type { DatabaseDriver } from "./driver";
import { createPostgresDriver } from "./postgres-driver";
import { createSqliteDriver } from "./sqlite-driver";

let driver: DatabaseDriver | null = null;

export function isPostgres(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgres");
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
