import { describe, expect, it } from "vitest";
import { normalizeMovie, normalizeMovieSummary } from "./normalize";

const sweeneyRaw = {
  id: 13885,
  title: "Sweeney Todd: The Demon Barber of Fleet Street",
  original_title: "Sweeney Todd: The Demon Barber of Fleet Street",
  overview: "A vengeful barber returns to London.",
  tagline: "Never forget. Never forgive.",
  release_date: "2007-12-20",
  runtime: 116,
  status: "Released",
  original_language: "en",
  genres: [
    { id: 10402, name: "Music" },
    { id: 18, name: "Drama" },
    { id: 27, name: "Horror" },
  ],
  poster_path: "/9x4i9dnH4J56n21ZueW87Asa1n.jpg",
  backdrop_path: "/backdrop.jpg",
  vote_average: 7.2,
  vote_count: 5000,
  popularity: 40,
  adult: false,
  production_companies: [{ id: 1, name: "DreamWorks Pictures" }],
  production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
  spoken_languages: [{ iso_639_1: "en", english_name: "English" }],
  budget: 0,
  revenue: 0,
  homepage: "",
  imdb_id: "tt0408236",
  credits: {
    cast: [{ id: 1, name: "Johnny Depp", character: "Sweeney Todd", order: 0, profile_path: "/dep.jpg" }],
    crew: [{ id: 2, name: "Tim Burton", job: "Director", department: "Directing" }],
  },
  videos: { results: [{ id: "1", key: "abc", site: "YouTube", type: "Trailer", official: true, name: "Trailer" }] },
  images: { posters: [{ file_path: "/p.jpg" }], backdrops: [{ file_path: "/b.jpg" }], logos: [{ file_path: "/l.png" }] },
  "watch/providers": {
    results: {
      US: {
        link: "https://www.themoviedb.org/movie/13885/watch",
        flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg" }],
      },
    },
  },
};

describe("normalizeMovie", () => {
  it("normalizes Sweeney Todd without inventing zeros", () => {
    const movie = normalizeMovie(sweeneyRaw, { region: "US", retrievedAt: "2026-09-25T00:00:00.000Z" });
    expect(movie).toMatchObject({
      id: 13885,
      tmdbId: 13885,
      title: "Sweeney Todd: The Demon Barber of Fleet Street",
      year: 2007,
      runtime: 116,
      voteAverage: 7.2,
      imdbId: "tt0408236",
      budget: null,
      revenue: null,
      homepage: null,
      source: "tmdb",
    });
    expect(movie?.watchProviders?.streaming[0]?.name).toBe("Netflix");
    expect(movie?.credits.cast[0]?.name).toBe("Johnny Depp");
  });

  it("returns null for incomplete records", () => {
    expect(normalizeMovieSummary({})).toBeNull();
  });
});
