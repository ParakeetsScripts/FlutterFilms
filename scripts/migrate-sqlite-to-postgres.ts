import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { runPostgresMigrations } from "../src/lib/db/migrate";
import { createPostgresDriver } from "../src/lib/db/postgres-driver";

function sqlitePath() {
  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured.slice("file:".length);
  return path.join(process.cwd(), ".data/flutter-films.db");
}

async function main() {
  const sqliteFile = sqlitePath();
  if (!fs.existsSync(sqliteFile)) {
    console.error(`SQLite database not found at ${sqliteFile}`);
    process.exit(1);
  }
  if (!process.env.DIRECT_DATABASE_URL?.startsWith("postgres") && !process.env.DATABASE_URL?.startsWith("postgres")) {
    console.error("Set DIRECT_DATABASE_URL or DATABASE_URL to a postgres connection string");
    process.exit(1);
  }

  const sqlite = new Database(sqliteFile, { readonly: true });
  const pg = createPostgresDriver(process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL);

  await runPostgresMigrations();

  const tables = [
    "movies",
    "movie_source_records",
    "movie_changes",
    "sync_jobs",
    "source_health",
    "search_index",
    "ai_providers",
    "ai_models",
    "model_usage",
  ] as const;

  const report: Record<string, { sqlite: number; postgres: number }> = {};

  for (const table of tables) {
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as Array<Record<string, unknown>>;
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map((col) => row[col]);
      const placeholders = columns.map(() => "?").join(", ");
      const updates = columns.map((col) => `${col} = excluded.${col}`).join(", ");
      const pk = table === "movies" || table === "search_index" || table === "source_health" || table === "ai_providers" || table === "ai_models"
        ? columns[0]
        : "id";
      await pg.run(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
         ON CONFLICT(${pk}) DO UPDATE SET ${updates}`,
        values,
      );
    }
    const pgCount = await pg.get<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
    report[table] = { sqlite: rows.length, postgres: Number(pgCount?.count ?? 0) };
  }

  console.log(JSON.stringify({ migrated: report, note: "SQLite file preserved. Run npm run db:verify to validate." }, null, 2));
  sqlite.close();
  await pg.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
