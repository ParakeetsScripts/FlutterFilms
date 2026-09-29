import { describe, expect, it } from "vitest";
import { buildMoviesHrefFromDraft, filterDraftFromParams } from "./filter-draft";

describe("filter draft", () => {
  it("round-trips country and decade filters into a movies URL", () => {
    const href = buildMoviesHrefFromDraft({
      genre: "28",
      year: "",
      language: "",
      country: "JP",
      ratingGte: "7",
      sort: "rating",
      yearGte: "1990",
      yearLte: "1999",
    });
    expect(href).toContain("country=JP");
    expect(href).toContain("genre=28");
    expect(href).toContain("yearGte=1990");
    expect(href).not.toContain("language=");
  });

  it("reads applied params back into draft state", () => {
    const params = new URLSearchParams("country=FR&language=all&sort=rating");
    expect(filterDraftFromParams(params)).toMatchObject({
      country: "FR",
      language: "",
      sort: "rating",
    });
  });
});
