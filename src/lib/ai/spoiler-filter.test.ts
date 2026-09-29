import { describe, expect, it } from "vitest";
import { filterMovieEvidenceForSpoiler, isEndingQuestion, overviewLineForSpoiler } from "./spoiler-filter";
import type { MovieEvidence } from "./evidence/types";

const sample: MovieEvidence = {
  movieId: 1,
  title: "Digger",
  year: 2026,
  tmdb: {
    overview: "A hero saves the day after betraying their mentor in the final act.",
    tagline: "A man. A plan. A meltdown.",
    genres: ["Comedy"],
    keywords: ["power", "satire", "betrayal", "ending"],
  },
  provenance: [],
  sources: [{ source: "tmdb" }],
};

describe("spoiler-filter", () => {
  it("removes plot overview at none", () => {
    const [filtered] = filterMovieEvidenceForSpoiler([sample], "none");
    expect(filtered.tmdb?.overview).toBeUndefined();
    expect(filtered.tmdb?.tagline).toBeUndefined();
    expect(overviewLineForSpoiler(sample.tmdb?.overview, "none")).toBeNull();
  });

  it("truncates overview at light", () => {
    const line = overviewLineForSpoiler(sample.tmdb?.overview, "light");
    expect(line).toContain("Premise");
    expect(line?.length).toBeLessThan(sample.tmdb!.overview!.length + 40);
  });

  it("detects ending questions", () => {
    expect(isEndingQuestion("What happens at the end?")).toBe(true);
    expect(isEndingQuestion("Who directed this?")).toBe(false);
  });
});
