import { createPostgresDriver } from "../src/lib/db/postgres-driver";
import { createSqliteDriver } from "../src/lib/db/sqlite-driver";

async function main() {
  const usePostgres = process.env.DATABASE_URL?.startsWith("postgres");
  const db = usePostgres ? createPostgresDriver() : createSqliteDriver();
  const start = Date.now();
  const row = await db.get<{ ok: number }>("SELECT 1 as ok");
  const latency = Date.now() - start;
  const movies = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM movies");
  console.log(
    JSON.stringify(
      {
        driver: db.kind,
        healthy: row?.ok === 1,
        queryLatencyMs: latency,
        movieCount: Number(movies?.count ?? 0),
      },
      null,
      2,
    ),
  );
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
