import { describe, expect, it } from "vitest";
import { isStubFeatureResult } from "./capability-audit";
import { validateAcceptanceContract, CONTRACT_BY_SLUG } from "./feature-acceptance-contracts";
import { defaultInputForSlug } from "./feature-inputs";
import { getFeatureDefinitions } from "./definitions";
import { executeFeatureService } from "./services";
import { getValidatedFeatures, countByStatus } from "./validate";

const FIXTURE_CTX = {
  userId: "00000000-0000-4000-8000-000000000001",
  favorites: [550, 680],
  history: [550, 13],
  watchlist: [680, 155],
};

describe("200-feature acceptance", () => {
  it("maintains exactly 200 catalog entries", () => {
    expect(getFeatureDefinitions()).toHaveLength(200);
  });

  it("reports honest status distribution", () => {
    const counts = countByStatus();
    expect(counts.live + counts.beta + counts.planned + counts.degraded + counts.error).toBe(200);
    expect(counts.live).toBeLessThan(200);
    expect(counts.beta).toBeGreaterThan(0);
    expect(CONTRACT_BY_SLUG.size).toBeGreaterThan(10);
  });

  it("only marks contracted features as hasTests", () => {
    for (const def of getFeatureDefinitions()) {
      if (CONTRACT_BY_SLUG.has(def.slug)) {
        expect(def.hasTests).toBe(true);
      } else {
        expect(def.hasTests).toBe(false);
      }
    }
  });

  it("executes contracted features with semantic assertions", async () => {
    const failures: string[] = [];
    for (const slug of CONTRACT_BY_SLUG.keys()) {
      const def = getFeatureDefinitions().find((f) => f.slug === slug)!;
      const result = await executeFeatureService(def, defaultInputForSlug(slug), FIXTURE_CTX);
      if (isStubFeatureResult(result)) {
        failures.push(`${slug}: stub — ${result.error}`);
        continue;
      }
      const contractError = validateAcceptanceContract(slug, result);
      if (contractError) failures.push(`${slug}: ${contractError}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  }, 120_000);

  it("beta features execute without stubs when fixtures provided", async () => {
    const beta = getValidatedFeatures().filter((f) => f.status === "beta" && f.hasService);
    const sample = beta.slice(0, 30);
    for (const feature of sample) {
      const def = getFeatureDefinitions().find((f) => f.slug === feature.slug)!;
      const result = await executeFeatureService(def, defaultInputForSlug(feature.slug), FIXTURE_CTX);
      expect(isStubFeatureResult(result), `${feature.slug}: ${result.error}`).toBe(false);
      expect(result.status, `${feature.slug}: ${result.error ?? ""}`).not.toBe("error");
    }
  }, 120_000);
});
