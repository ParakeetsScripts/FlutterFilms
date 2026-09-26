import fs from "node:fs";
import path from "node:path";

function sqlitePath() {
  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured.slice("file:".length);
  if (configured && !configured.startsWith("postgres")) return configured;
  return path.join(process.cwd(), ".data/flutter-films.db");
}

async function main() {
  const sqlite = sqlitePath();
  const exists = fs.existsSync(sqlite);
  const size = exists ? fs.statSync(sqlite).size : 0;
  const postgresConfigured = Boolean(process.env.DATABASE_URL?.startsWith("postgres"));

  console.log(
    JSON.stringify(
      {
        sqlitePath: sqlite,
        sqliteExists: exists,
        sqliteBytes: size,
        postgresConfigured,
        rollbackSafe: exists,
        note: "SQLite file is never deleted automatically. Keep until Postgres verification passes.",
      },
      null,
      2,
    ),
  );
}

main();
