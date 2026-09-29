import { describe, expect, it } from "vitest";
import { countActiveFilters } from "./filters";

describe("discover filters", () => {
  it("counts only non-default active filters", () => {
    expect(
      countActiveFilters({
        genre: "28",
        year: "",
        language: "ta",
        country: "",
        ratingGte: "7",
        sort: "rating",
        yearGte: "2020",
        yearLte: "2029",
      }),
    ).toBe(5);
  });

  it("ignores default sort", () => {
    expect(
      countActiveFilters({
        genre: "",
        year: "",
        language: "",
        country: "",
        ratingGte: "",
        sort: "popularity",
        yearGte: "",
        yearLte: "",
      }),
    ).toBe(0);
  });
});
