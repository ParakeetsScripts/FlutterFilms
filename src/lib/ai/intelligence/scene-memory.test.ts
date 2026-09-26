import { describe, expect, it } from "vitest";
import { parseSceneDescription } from "./scene-memory-parser";

describe("scene memory parser", () => {
  it("extracts snow and era clues", () => {
    const parsed = parseSceneDescription([
      "Two people trapped in a snowy building",
      "Around 2010",
    ]);
    expect(parsed.clues.some((c) => c.value.includes("snow"))).toBe(true);
    expect(parsed.yearHint).toBe(2010);
  });

  it("reports missing info for sparse input", () => {
    const parsed = parseSceneDescription(["something scary"]);
    expect(parsed.missing.length).toBeGreaterThan(0);
  });
});
