import { describe, expect, it } from "vitest";
import { parseVibeQuery } from "./vibe-query";

const EXAMPLES = [
  "something like Interstellar but funnier",
  "give me one movie for tonight",
  "a thriller under 2 hours",
  "something completely different from what I normally watch",
] as const;

describe("parseVibeQuery", () => {
  it("routes the hero example chips to the right modes", () => {
    expect(parseVibeQuery(EXAMPLES[0])).toMatchObject({
      mode: "reference_twist",
      referenceTitle: "Interstellar",
      twistGenres: [35],
      resultLimit: 6,
    });
    expect(parseVibeQuery(EXAMPLES[1])).toMatchObject({
      mode: "tonight_pick",
      singlePick: true,
      resultLimit: 1,
    });
    expect(parseVibeQuery(EXAMPLES[2])).toMatchObject({
      mode: "genre_filtered",
      filterGenres: [53],
      runtimeLte: 120,
      resultLimit: 6,
    });
    expect(parseVibeQuery(EXAMPLES[3])).toMatchObject({
      mode: "explore_outside",
      resultLimit: 6,
    });
  });
});
