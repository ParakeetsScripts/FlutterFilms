import { describe, expect, it } from "vitest";
import { toPositionalSql } from "./driver";

describe("toPositionalSql", () => {
  it("converts sqlite placeholders to postgres", () => {
    expect(toPositionalSql("SELECT * FROM movies WHERE tmdb_id = ? AND title = ?", "postgres")).toBe(
      "SELECT * FROM movies WHERE tmdb_id = $1 AND title = $2",
    );
  });

  it("leaves sqlite sql unchanged", () => {
    expect(toPositionalSql("SELECT * FROM movies WHERE tmdb_id = ?", "sqlite")).toBe(
      "SELECT * FROM movies WHERE tmdb_id = ?",
    );
  });
});
