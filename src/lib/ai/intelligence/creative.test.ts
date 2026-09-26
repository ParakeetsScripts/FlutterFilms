import { describe, expect, it } from "vitest";
import { buildCreativeAsset } from "./creative";

describe("buildCreativeAsset", () => {
  it("returns labeled SVG concept art", () => {
    const asset = buildCreativeAsset("poster", { title: "Neon Nights" });
    expect(asset.svg).toContain("Neon Nights");
    expect(asset.disclaimer).toMatch(/concept|SVG|generative/i);
    expect(asset.labels[0].kind).toBe("ai_interpretation");
  });

  it("returns review outline text", () => {
    const asset = buildCreativeAsset("review_outline", { title: "Test Film" });
    expect(asset.textContent).toContain("Review outline");
  });
});
