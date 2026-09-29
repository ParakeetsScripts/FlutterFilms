import { describe, expect, it } from "vitest";
import { buildMoviesDiscoverQuery, buildMoviesPageHref, resolveOriginalLanguage } from "./query";

describe("movies discover query", () => {
  const catalog = { uiLanguage: "en", originalLanguage: "hi", region: "US" };

  it("does not silently apply catalog language when URL has no language param", () => {
    expect(resolveOriginalLanguage({})).toBeUndefined();
  });

  it("clears language filtering when language=all is set", () => {
    expect(resolveOriginalLanguage({ language: "all" })).toBeUndefined();
  });

  it("keeps pagination params when building next page links", () => {
    const href = buildMoviesPageHref(
      { genre: "28", sort: "rating", page: "2" },
      { page: 3 },
    );
    expect(href).toBe("/movies?genre=28&sort=rating&page=3");
  });

  it("builds discover query from URL params including country", () => {
    const query = buildMoviesDiscoverQuery(
      { genre: "12", country: "IN", yearGte: "1990", yearLte: "1999", ratingGte: "7", sort: "rating", page: "2" },
      catalog,
    );
    expect(query).toMatchObject({
      genre: 12,
      originCountry: "IN",
      yearGte: 1990,
      yearLte: 1999,
      ratingGte: 7,
      sort: "rating",
      page: 2,
      originalLanguage: undefined,
    });
  });
});
