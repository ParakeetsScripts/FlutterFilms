import { describe, expect, it } from "vitest";
import { parseVibeQuery } from "@/lib/ai/intelligence/vibe-query";
import type { HomeSection } from "@/lib/home";
import type { MovieSummary } from "@/lib/tmdb/types";
import {
  LOWER_NOISE_RULES,
  isLowerNoise,
  lowerNoiseQuery,
  selectExplore,
  selectLowerNoise,
  selectNewReleases,
  sortLowerNoise,
} from "./chapters";
import { formatRuntimeLimit, signalsFromParsedQuery } from "./console-signals";

function movie(id: number, voteAverage: number | null = 7.5, voteCount: number | null = 1000): MovieSummary {
  return {
    id,
    tmdbId: id,
    title: `Movie ${id}`,
    originalTitle: null,
    overview: null,
    releaseDate: "2020-01-01",
    year: 2020,
    posterPath: null,
    backdropPath: null,
    voteAverage,
    voteCount,
    popularity: 10,
    originalLanguage: "en",
    genres: [],
    adult: false,
    source: "tmdb",
    sourceVersion: "3",
    retrievedAt: "2026-01-01T00:00:00.000Z",
  };
}

function section(id: string, movies: MovieSummary[]): HomeSection {
  return { id, title: id, movies };
}

describe("selectExplore", () => {
  it("leaves out titles already in the viewer's library", () => {
    const sections = [section("top-rated", [movie(1), movie(2), movie(3)])];
    const result = selectExplore(sections, { history: [1], favorites: [], watchlist: [3] });
    expect(result.movies.map((m) => m.id)).toEqual([2]);
    expect(result.excludesLibrary).toBe(true);
  });

  it("does not claim library filtering for new viewers", () => {
    const result = selectExplore([section("top-rated", [movie(1)])], { history: [], favorites: [], watchlist: [] });
    expect(result.excludesLibrary).toBe(false);
  });
});

describe("selectNewReleases", () => {
  it("prefers now-playing and reports the basis honestly", () => {
    expect(selectNewReleases([section("new-releases", [movie(1)]), section("upcoming", [movie(2)])]).basis).toBe("now-playing");
    expect(selectNewReleases([section("new-releases", []), section("upcoming", [movie(2)])]).basis).toBe("upcoming");
    expect(selectNewReleases([]).basis).toBe("none");
  });
});

describe("selectLowerNoise", () => {
  const band = Array.from({ length: 32 }, (_, i) => movie(100 + i, 7.5, 300 + i * 80));
  const sections = [
    section("trending", [movie(100, 8, 300)]),
    section("popular", [movie(101, 8, 400)]),
    section("top-rated", [movie(1, 8.6, 20000), movie(2, 8.5, 15000)]),
    section("lower-noise", [...band, movie(50, 7.4, 90), movie(51, 7.9, 9000), movie(52, 6.8, 500)]),
  ];

  it("keeps only rated, low-vote titles that are not on today's mainstream lists", () => {
    const result = selectLowerNoise(sections, new Set());
    expect(result.basis).toBe("lower-noise");
    const ids = [...result.movies, ...result.reserve].map((m) => m.id);
    expect(ids).not.toContain(100);
    expect(ids).not.toContain(101);
    expect(ids).not.toContain(50);
    expect(ids).not.toContain(51);
    expect(ids).not.toContain(52);
    expect(result.movies).toHaveLength(LOWER_NOISE_RULES.pageSize);
    expect(result.reserve.length).toBeGreaterThan(0);
    expect([...result.movies, ...result.reserve].every(isLowerNoise)).toBe(true);
  });

  it("falls back to top-rated, and says so, when too few titles qualify", () => {
    const result = selectLowerNoise([sections[2], section("lower-noise", band.slice(2, 4))], new Set());
    expect(result.basis).toBe("top-rated");
    expect(result.movies.map((m) => m.id)).toEqual([1, 2]);
    expect(result.reserve).toEqual([]);
  });

  it("builds the TMDB query from the shared rule", () => {
    const query = lowerNoiseQuery(3, new Date("2026-09-28T12:00:00Z"));
    expect(query).toMatchObject({
      page: 3,
      sort: "rating",
      ratingGte: LOWER_NOISE_RULES.minRating,
      voteCountGte: LOWER_NOISE_RULES.minVotes,
      voteCountLte: LOWER_NOISE_RULES.maxVotes,
      releaseDateLte: "2026-09-28",
    });
  });

  it("sorts the displayed set without changing its members", () => {
    const list = [movie(1, 7.3, 900), movie(2, 8.1, 300), movie(3, 7.8, 150)];
    expect(sortLowerNoise(list, "rating").map((m) => m.id)).toEqual([2, 3, 1]);
    expect(sortLowerNoise(list, "votes").map((m) => m.id)).toEqual([3, 2, 1]);
  });
});

describe("console signals", () => {
  const labels = (query: string) => signalsFromParsedQuery(parseVibeQuery(query)).map((signal) => signal.label);

  it("mirrors the parser for the homepage prompts", () => {
    expect(labels("something like Interstellar but funnier")).toEqual(["Like Interstellar", "+ Comedy"]);
    expect(labels("a thriller under 2 hours")).toEqual(["Thriller", "≤ 2h"]);
    expect(labels("give me one movie for tonight")).toEqual(["One pick"]);
    expect(labels("something completely different from what I normally watch")).toEqual([
      "TMDB 7+",
      "Outside your usual",
    ]);
  });

  it("formats runtime limits compactly", () => {
    expect(formatRuntimeLimit(45)).toBe("≤ 45 min");
    expect(formatRuntimeLimit(90)).toBe("≤ 1h 30m");
    expect(formatRuntimeLimit(120)).toBe("≤ 2h");
  });
});
