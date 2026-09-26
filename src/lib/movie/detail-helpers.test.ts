import { describe, expect, it } from "vitest";
import { castRoleLine, dedupeMovies } from "./detail-helpers";

describe("detail helpers", () => {
  it("dedupes movies by id", () => {
    const movies = [
      { id: 1, title: "A" },
      { id: 2, title: "B" },
      { id: 1, title: "A dup" },
    ];
    expect(dedupeMovies(movies, 8)).toHaveLength(2);
  });

  it("hides duplicate cast role when same as name", () => {
    expect(castRoleLine({ id: 1, name: "Jacob Tremblay", character: "Jacob Tremblay", job: null, department: null, profilePath: null, order: 0 })).toBeNull();
    expect(castRoleLine({ id: 1, name: "Jacob Tremblay", character: "Ted Kaczynski", job: null, department: null, profilePath: null, order: 0 })).toBe("Ted Kaczynski");
  });
});
