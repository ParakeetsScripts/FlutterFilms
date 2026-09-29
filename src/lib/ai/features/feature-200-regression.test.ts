import { describe, expect, it } from "vitest";
import { FEATURE_CATALOG } from "./catalog";
import { FEATURE_CATALOG_EXTENDED } from "./catalog-extended";
import { CONTRACT_BY_SLUG } from "./feature-acceptance-contracts";
import { getValidatedFeatures, countByStatus } from "./validate";

describe("200-feature catalog integrity", () => {
  it("has 100 base and 100 extended entries", () => {
    expect(FEATURE_CATALOG_EXTENDED).toHaveLength(100);
    expect(FEATURE_CATALOG).toHaveLength(200);
  });

  it("uses unique ids 1–200 and unique slugs", () => {
    const ids = FEATURE_CATALOG.map((f) => f.id);
    const slugs = FEATURE_CATALOG.map((f) => f.slug);
    expect(new Set(ids).size).toBe(200);
    expect(new Set(slugs).size).toBe(200);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(200);
  });

  it("marks all 200 as LIVE only with contracts", () => {
    const counts = countByStatus();
    expect(CONTRACT_BY_SLUG.size).toBe(200);
    expect(counts.live).toBe(200);
    expect(counts.beta).toBe(0);
    expect(counts.planned).toBe(0);
  });

  it("extended catalog entries are live once contracted", () => {
    const extendedSlugs = new Set(FEATURE_CATALOG_EXTENDED.map((f) => f.slug));
    const extended = getValidatedFeatures().filter((f) => extendedSlugs.has(f.slug));
    expect(extended.every((f) => f.status === "live")).toBe(true);
  });
});
