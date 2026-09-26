import { describe, expect, it } from "vitest";
import { parseMediaFilename } from "./filename";
import { rankCandidate } from "./ranking";

describe("filename parsing", () => {
  it("extracts title and year from a Kodi-style name", () => {
    expect(parseMediaFilename("Batman Begins (2005).mkv")).toMatchObject({
      title: "Batman Begins",
      year: 2005,
    });
  });

  it("extracts TMDB and IMDb ids", () => {
    expect(parseMediaFilename("tmdb/13885 Sweeney Todd.mkv")).toMatchObject({ tmdbId: 13885 });
    expect(parseMediaFilename("Movie tt0408236.mp4")).toMatchObject({ imdbId: "tt0408236" });
  });

  it("ranks exact title and year highest", () => {
    const parsed = parseMediaFilename("Sweeney Todd (2007).mkv");
    const ranked = rankCandidate(parsed, {
      id: 13885,
      tmdbId: 13885,
      title: "Sweeney Todd",
      originalTitle: null,
      overview: null,
      releaseDate: "2007-12-20",
      year: 2007,
      posterPath: null,
      backdropPath: null,
      voteAverage: 7.2,
      voteCount: 10,
      popularity: 30,
      originalLanguage: "en",
      genres: [],
      adult: false,
      source: "tmdb",
      sourceVersion: "3",
      retrievedAt: "now",
    });
    expect(ranked.score).toBeGreaterThan(0.8);
  });
});
