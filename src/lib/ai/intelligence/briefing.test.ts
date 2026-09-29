import { describe, expect, it } from "vitest";
import {
  buildSpoilerZoneBody,
  formatBriefingRatings,
} from "@/lib/ai/intelligence/briefing";
import type { Movie } from "@/lib/tmdb/types";

function baseMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 1,
    tmdbId: 1,
    title: "Test Movie",
    originalTitle: "Test Movie",
    overview: "A hero saves the day after a long journey.",
    tagline: "Believe again.",
    releaseDate: "2026-01-01",
    year: 2026,
    runtime: 102,
    posterPath: null,
    backdropPath: null,
    voteAverage: 8.9,
    voteCount: 1200,
    popularity: 10,
    adult: false,
    genres: [{ id: 1, name: "Adventure" }],
    productionCompanies: [],
    productionCountries: [],
    spokenLanguages: [],
    budget: null,
    revenue: null,
    homepage: null,
    imdbId: "tt1234567",
    credits: { cast: [], crew: [] },
    videos: [],
    images: { posters: [], backdrops: [], logos: [] },
    watchProviders: null,
    collection: null,
    keywords: [{ id: 1, name: "friendship" }],
    releases: { certification: "PG", byRegion: [] },
    status: null,
    source: "tmdb",
    sourceVersion: "3",
    retrievedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Movie;
}

describe("formatBriefingRatings", () => {
  it("formats TMDB and IMDb separately with vote counts", () => {
    const body = formatBriefingRatings(
      baseMovie({
        tmdbRating: 8.9,
        tmdbVoteCount: 1500,
        imdbRating: 7.4,
        imdbVoteCount: 9000,
      }),
    );
    expect(body).toContain("TMDB 8.9 (1,500 votes)");
    expect(body).toContain("IMDb 7.4 (9,000 votes)");
    expect(body).toContain("never averaged");
  });

  it("reports pending IMDb sync when only the title is linked", () => {
    const body = formatBriefingRatings(baseMovie({ imdbRating: null, imdbVoteCount: null }));
    expect(body).toContain("IMDb rating pending sync (tt1234567)");
  });
});

describe("buildSpoilerZoneBody", () => {
  it("returns the full catalog overview at moderate spoiler level", () => {
    const movie = baseMovie();
    expect(buildSpoilerZoneBody(movie, "moderate")).toBe(movie.overview);
  });

  it("adds tagline and keywords at full spoiler level", () => {
    const movie = baseMovie();
    const body = buildSpoilerZoneBody(movie, "full");
    expect(body).toContain(movie.overview);
    expect(body).toContain("Tagline: Believe again.");
    expect(body).toContain("Catalog keywords: friendship.");
  });
});
