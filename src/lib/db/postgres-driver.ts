import { Pool } from "@neondatabase/serverless";
import type { DatabaseDriver } from "./driver";
import { toPositionalSql } from "./driver";

export function createPostgresDriver(url?: string): DatabaseDriver {
  const connectionString = url ?? process.env.DATABASE_URL;
  if (!connectionString?.startsWith("postgres")) {
    throw new Error("DATABASE_URL must be a postgres connection string");
  }
  const pool = new Pool({ connectionString });

  return {
    kind: "postgres",
    async get<T>(query: string, params: unknown[] = []) {
      const result = await pool.query(toPositionalSql(query, "postgres"), params);
      return (result.rows[0] as T | undefined) ?? null;
    },
    async all<T>(query: string, params: unknown[] = []) {
      const result = await pool.query(toPositionalSql(query, "postgres"), params);
      return result.rows as T[];
    },
    async run(query: string, params: unknown[] = []) {
      const result = await pool.query(toPositionalSql(query, "postgres"), params);
      return { changes: result.rowCount ?? 0 };
    },
    async exec(query: string) {
      await pool.query(query);
    },
    async close() {
      await pool.end();
    },
  };
}
