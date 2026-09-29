import { describe, expect, it } from "vitest";
import {
  appendUnique,
  catalogQueryKey,
  chunkRows,
  clampPage,
  columnsForWidth,
  lockedCinemaColumns,
  formatPageCount,
  formatResultCount,
  languageName,
  parseCatalogView,
  ratingLabel,
  resultPosition,
} from "./catalog-view";
import type { MovieSummary } from "@/lib/tmdb/types";

const stub = (id: number) => ({ id }) as MovieSummary;

describe("catalog presentation adapter", () => {
  it("keys a query by its filters, ignoring page and empty values", () => {
    expect(catalogQueryKey({ page: "3", genre: "878", sort: "rating", year: "" })).toBe("genre=878&sort=rating");
    expect(catalogQueryKey({ sort: "rating", genre: "878" })).toBe(catalogQueryKey({ genre: "878", sort: "rating" }));
  });

  it("falls back to the default view for unknown stored values", () => {
    expect(parseCatalogView("archive")).toBe("archive");
    expect(parseCatalogView("constellation")).toBe("constellation");
    expect(parseCatalogView("orbit")).toBe("cinema");
    expect(parseCatalogView(null)).toBe("cinema");
  });

  it("clamps page jumps to what TMDB can serve", () => {
    expect(clampPage(9999, 1001)).toBe(500);
    expect(clampPage(0, 12)).toBe(1);
    expect(clampPage(Number.NaN, 12)).toBe(1);
    expect(clampPage(7.4, 12)).toBe(7);
  });

  it("never presents TMDB's 20,001 cap as an exact count", () => {
    expect(formatResultCount(20001)).toBe("20,000+");
    expect(formatResultCount(11961)).toBe("11,961");
    expect(formatPageCount(1001)).toBe("1,000+");
    expect(formatPageCount(599)).toBe("599");
  });

  it("labels ratings with their source and avoids a fake 0.0", () => {
    expect(ratingLabel({ voteAverage: 7.86 })).toBe("TMDB 7.9");
    expect(ratingLabel({ voteAverage: null })).toBe("Rating unavailable");
  });

  it("computes positions within the full ordering", () => {
    expect(resultPosition(1, 0)).toBe(1);
    expect(resultPosition(3, 4)).toBe(45);
  });

  it("lays out cinema rows from the available width", () => {
    expect(columnsForWidth(1100, 176, 28)).toBe(5);
    expect(columnsForWidth(360, 176, 28)).toBe(1);
    expect(columnsForWidth(5000, 176, 28)).toBe(7);
    expect(chunkRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("locks cinema columns to stable breakpoints", () => {
    expect(lockedCinemaColumns(390)).toBe(2);
    expect(lockedCinemaColumns(700)).toBe(3);
    expect(lockedCinemaColumns(1100)).toBe(4);
    expect(lockedCinemaColumns(1300)).toBe(5);
    expect(lockedCinemaColumns(1600)).toBe(6);
  });

  it("appends loaded pages without duplicating titles", () => {
    expect(appendUnique([stub(1), stub(2)], [stub(2), stub(3)]).map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("names languages from the shared list", () => {
    expect(languageName("fr")).toBeTruthy();
    expect(languageName(null)).toBeNull();
  });
});
