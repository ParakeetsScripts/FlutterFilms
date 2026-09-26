export type DbKind = "sqlite" | "postgres";

export type QueryResult = {
  changes: number;
  lastInsertRowid?: number | bigint;
};

export interface DatabaseDriver {
  kind: DbKind;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<QueryResult>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export function toPositionalSql(sql: string, kind: DbKind): string {
  if (kind === "sqlite") return sql;
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}
