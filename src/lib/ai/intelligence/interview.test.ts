import { describe, expect, it } from "vitest";
import { buildInterviewProfile } from "./interview";

describe("buildInterviewProfile", () => {
  it("builds a profile from answers", () => {
    const profile = buildInterviewProfile({ mood: "cozy", genres: "drama" });
    expect(profile.summary).toContain("cozy");
    expect(profile.labels).toHaveLength(2);
  });
});
