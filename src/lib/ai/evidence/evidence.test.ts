import { describe, expect, it } from "vitest";

import { movieEvidenceFromCatalog } from "./types";

describe("movie evidence provenance", () => {
  it("keeps TMDB and IMDb ratings separate with provenance", () => {
    const evidence = movieEvidenceFromCatalog({
      id: 27205,
      tmdbId: 27205,
      title: "Inception",
      originalTitle: null,
      overview: null,
      tagline: null,
      releaseDate: "2010-07-16",
      year: 2010,
      runtime: 148,
      status: "Released",
      originalLanguage: "en",
      genres: [{ id: 28, name: "Action" }],
      posterPath: null,
      backdropPath: null,
      logoPaths: [],
      voteAverage: 8.4,
      voteCount: 1000,
      popularity: 1,
      adult: false,
      productionCompanies: [],
      productionCountries: [],
      spokenLanguages: [],
      budget: null,
      revenue: null,
      homepage: null,
      imdbId: "tt1375666",
      credits: { cast: [], crew: [] },
      videos: [],
      images: { posters: [], backdrops: [], logos: [] },
      watchProviders: null,
      collection: null,
      keywords: [],
      releases: { certification: null, byRegion: [] },
      source: "tmdb",
      sourceVersion: "3",
      retrievedAt: "2026-01-01T00:00:00.000Z",
      tmdbRating: 8.4,
      tmdbVoteCount: 1000,
      imdbRating: 8.8,
      imdbVoteCount: 2000000,
      lastSyncedAt: "2026-01-01T00:00:00.000Z",
      metadataUpdatedAt: "2026-01-01T00:00:00.000Z",
      ratingsUpdatedAt: "2026-01-01T00:00:00.000Z",
      metadataCompleteness: 0.9,
      sourceRecords: [],
    });

    expect(evidence.tmdb?.rating).toBe(8.4);
    expect(evidence.imdb?.rating).toBe(8.8);
    expect(evidence.provenance.find((p) => p.field === "tmdbRating")?.source).toBe("tmdb");
    expect(evidence.provenance.find((p) => p.field === "imdbRating")?.source).toBe("imdb");
  });
});
