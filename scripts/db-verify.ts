import { createPostgresDriver } from "../src/lib/db/postgres-driver";
import { createSqliteDriver } from "../src/lib/db/sqlite-driver";

async function main() {
  const usePostgres = process.env.DATABASE_URL?.startsWith("postgres");
  const db = usePostgres ? createPostgresDriver() : createSqliteDriver();

  const checks = [
    { name: "movies", sql: "SELECT COUNT(*) as count FROM movies" },
    { name: "search_index", sql: "SELECT COUNT(*) as count FROM search_index" },
    { name: "users", sql: "SELECT COUNT(*) as count FROM users" },
    { name: "analytics_events", sql: "SELECT COUNT(*) as count FROM analytics_events" },
    { name: "shared_watchlists", sql: "SELECT COUNT(*) as count FROM shared_watchlists" },
    { name: "movie_rooms", sql: "SELECT COUNT(*) as count FROM movie_rooms" },
    { name: "agent_memories", sql: "SELECT COUNT(*) as count FROM agent_memories" },
    { name: "generation_jobs", sql: "SELECT COUNT(*) as count FROM generation_jobs" },
    { name: "feature_runs", sql: "SELECT COUNT(*) as count FROM feature_runs" },
    { name: "ai_models", sql: "SELECT COUNT(*) as count FROM ai_models" },
    { name: "sync_jobs", sql: "SELECT COUNT(*) as count FROM sync_jobs" },
  ];

  const report: Record<string, number> = {};
  const errors: string[] = [];

  for (const check of checks) {
    try {
      const row = await db.get<{ count: number }>(check.sql);
      report[check.name] = Number(row?.count ?? 0);
    } catch (error) {
      errors.push(`${check.name}: ${error instanceof Error ? error.message : "error"}`);
      report[check.name] = -1;
    }
  }

  let orphanSearch = 0;
  try {
    const row = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM search_index s
       LEFT JOIN movies m ON m.tmdb_id = s.tmdb_id
       WHERE m.tmdb_id IS NULL`,
    );
    orphanSearch = Number(row?.count ?? 0);
  } catch {
    orphanSearch = -1;
  }

  const productionReady = usePostgres && errors.length === 0;

  console.log(
    JSON.stringify(
      {
        driver: db.kind,
        productionReady,
        counts: report,
        orphanSearchRows: orphanSearch,
        tableErrors: errors,
      },
      null,
      2,
    ),
  );
  await db.close();
  if (errors.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
