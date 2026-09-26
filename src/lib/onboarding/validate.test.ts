import { describe, expect, it } from "vitest";
import { sanitizeOnboardingPayload, validateOnboardingComplete } from "./validate";
import { defaultOnboardingState } from "./types";

describe("onboarding validate", () => {
  it("dedupes movies by tmdb id", () => {
    const state = sanitizeOnboardingPayload({
      favoriteMovies: [
        { tmdbId: 1, title: "A", year: 2020, posterPath: null },
        { tmdbId: 1, title: "A duplicate", year: 2020, posterPath: null },
        { tmdbId: 2, title: "B", year: 2021, posterPath: null },
      ],
    });
    expect(state?.favoriteMovies).toHaveLength(2);
  });

  it("requires minimum movies on complete", () => {
    const state = { ...defaultOnboardingState(), favoriteMovies: [], favoriteGenres: [28], preferredLanguages: ["en"] };
    expect(validateOnboardingComplete(state)).toMatch(/at least 3 movies/i);
  });

  it("passes valid complete state", () => {
    const state = {
      ...defaultOnboardingState(),
      favoriteMovies: [
        { id: 1, tmdbId: 1, title: "A", year: 2020, posterPath: null },
        { id: 2, tmdbId: 2, title: "B", year: 2021, posterPath: null },
        { id: 3, tmdbId: 3, title: "C", year: 2022, posterPath: null },
      ],
      favoriteGenres: [28],
      preferredLanguages: ["en"],
    };
    expect(validateOnboardingComplete(state)).toBeNull();
  });
});
