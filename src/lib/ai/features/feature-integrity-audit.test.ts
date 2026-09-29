import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FEATURE_CATALOG } from "./catalog";
import { executionModeForSlug } from "./feature-execution-modes";
import { implementationTierForSlug, tierAllowsLive } from "./feature-implementation-quality";
import { CONTRACT_BY_SLUG, validateAcceptanceContract } from "./feature-acceptance-contracts";
import { hasAcceptanceTest, acceptanceTestCount } from "./feature-test-registry";
import { defaultInputForSlug } from "./feature-inputs";
import { executeFeatureService } from "./services";
import { getValidatedFeatures, countByStatus } from "./validate";
import { isGenericHandlerResult, isStubFeatureResult } from "./capability-audit";

const FIXTURE_CTX = {
  userId: "00000000-0000-4000-8000-000000000001",
  favorites: [550, 680],
  history: [550, 13],
  watchlist: [680, 155],
};

describe("feature integrity audit", () => {
  it("catalog has exactly 200 unique ids and slugs", () => {
    const ids = FEATURE_CATALOG.map((f) => f.id);
    const slugs = FEATURE_CATALOG.map((f) => f.slug);
    expect(ids).toHaveLength(200);
    expect(new Set(ids).size).toBe(200);
    expect(new Set(slugs).size).toBe(200);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(200);
  });

  it("registers an acceptance contract for every capability", () => {
    const defs = getValidatedFeatures();
    expect(CONTRACT_BY_SLUG.size).toBe(200);
    for (const feature of defs) {
      expect(CONTRACT_BY_SLUG.has(feature.slug), feature.slug).toBe(true);
      expect(feature.hasTests).toBe(true);
    }
  });

  it("registered contracts pass semantic assertions", async () => {
    const failures: string[] = [];
    for (const slug of CONTRACT_BY_SLUG.keys()) {
      const def = getValidatedFeatures().find((f) => f.slug === slug)!;
      const result = await executeFeatureService(def, defaultInputForSlug(slug), FIXTURE_CTX);
      const err = validateAcceptanceContract(slug, result);
      if (err) failures.push(`${slug}: ${err}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  }, 120_000);

  it("writes FEATURE_DIFFERENTIATION_AUDIT.md", () => {
    const validated = getValidatedFeatures();
    const counts = countByStatus();
    const lines = [
      "# FlutterFilms — Feature Differentiation Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- **Total catalog:** 200`,
      `- **LIVE:** ${counts.live}`,
      `- **BETA:** ${counts.beta}`,
      `- **PLANNED:** ${counts.planned}`,
      `- **Acceptance contracts:** ${acceptanceTestCount()}`,
      "",
      "| ID | Slug | Name | Category | Tier | Mode | Status | Has Contract |",
      "| ---: | --- | --- | --- | --- | --- | --- | --- |",
    ];
    for (const f of validated) {
      lines.push(
        `| ${f.id} | ${f.slug} | ${f.title} | ${f.category} | ${implementationTierForSlug(f.slug)} | ${executionModeForSlug(f.slug)} | ${f.status} | ${hasAcceptanceTest(f.slug) ? "yes" : "no"} |`,
      );
    }
    const out = join(process.cwd(), "docs/FEATURE_DIFFERENTIATION_AUDIT.md");
    writeFileSync(out, lines.join("\n"));
    expect(counts.live).toBeLessThanOrEqual(200);
    expect(counts.live + counts.beta + counts.planned).toBe(200);
  });

  it("flags generic handlers among LIVE features", async () => {
    const live = getValidatedFeatures().filter((f) => f.status === "live");
    for (const feature of live) {
      const result = await executeFeatureService(feature, defaultInputForSlug(feature.slug), FIXTURE_CTX);
      expect(isStubFeatureResult(result), feature.slug).toBe(false);
      expect(isGenericHandlerResult(result), `${feature.slug} is generic`).toBe(false);
      expect(tierAllowsLive(implementationTierForSlug(feature.slug))).toBe(true);
    }
  }, 120_000);
});
