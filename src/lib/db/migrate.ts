import fs from "node:fs";
import path from "node:path";
import { createPostgresDriver } from "./postgres-driver";

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith("--"));
}

export async function runPostgresMigrations(migrationsDir = path.join(process.cwd(), "db/migrations")) {
  const db = createPostgresDriver();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    for (const statement of splitSqlStatements(sql)) {
      await db.exec(`${statement};`);
    }
    console.log(`Applied migration: ${file}`);
  }
}
