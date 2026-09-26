import { runPostgresMigrations } from "../src/lib/db/migrate";

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) {
    console.error("DATABASE_URL must be a postgres connection string for db:migrate");
    process.exit(1);
  }
  await runPostgresMigrations();
  console.log("Migrations complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
