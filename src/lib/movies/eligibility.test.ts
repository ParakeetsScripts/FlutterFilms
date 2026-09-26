import { describe, expect, it } from "vitest";
import {
  filterWatchableTonight,
  isReleasedByToday,
  meetsRuntimeConstraint,
  todayIso,
} from "./eligibility";
import type { MovieSummary } from "@/lib/tmdb/types";

function movie(partial: Partial<MovieSummary> & { id: number; title: string }): MovieSummary {
  return {
    id: partial.id,
    tmdbId: partial.id,
    title: partial.title,
    originalTitle: partial.originalTitle ?? null,
    overview: partial.overview ?? null,
    releaseDate: partial.releaseDate ?? null,
    year: partial.year ?? null,
    posterPath: partial.posterPath ?? null,
    backdropPath: partial.backdropPath ?? null,
    voteAverage: partial.voteAverage ?? null,
    voteCount: partial.voteCount ?? null,
    popularity: partial.popularity ?? null,
    originalLanguage: partial.originalLanguage ?? "en",
    genres: partial.genres ?? [],
    adult: false,
    source: "tmdb",
    sourceVersion: "3",
    retrievedAt: "2026-09-26T00:00:00.000Z",
  };
}

const asOf = new Date("2026-09-26T12:00:00Z");

describe("eligibility", () => {
  it("todayIso returns UTC date", () => {
    expect(todayIso(asOf)).toBe("2026-09-26");
  });

  it("excludes future releases", () => {
    expect(isReleasedByToday(movie({ id: 1, title: "Clay", releaseDate: "2028-11-01" }), asOf)).toBe(false);
    expect(isReleasedByToday(movie({ id: 2, title: "Old", releaseDate: "2020-01-01" }), asOf)).toBe(true);
  });

  it("excludes unknown release dates", () => {
    expect(isReleasedByToday(movie({ id: 3, title: "Mystery", releaseDate: null, year: null }), asOf)).toBe(false);
  });

  it("uses year fallback conservatively", () => {
    expect(isReleasedByToday(movie({ id: 4, title: "Future", year: 2031 }), asOf)).toBe(false);
    expect(isReleasedByToday(movie({ id: 5, title: "Past", year: 2019 }), asOf)).toBe(true);
  });

  it("runtime constraint rejects unknown runtime when required", () => {
    expect(meetsRuntimeConstraint(null, 60)).toBe(false);
    expect(meetsRuntimeConstraint(47, 60)).toBe(true);
    expect(meetsRuntimeConstraint(90, 60)).toBe(false);
  });

  it("filterWatchableTonight removes future titles", () => {
    const pool = [
      movie({ id: 1, title: "Clay", releaseDate: "2028-11-01" }),
      movie({ id: 2, title: "Inception", releaseDate: "2010-07-16" }),
    ];
    const out = filterWatchableTonight(pool, { asOf });
    expect(out.map((m) => m.title)).toEqual(["Inception"]);
  });
});
