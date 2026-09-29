import { describe, expect, it } from "vitest";

import { isGenericHandlerResult, isStubFeatureResult } from "./capability-audit";
import { validateAcceptanceContract, CONTRACT_BY_SLUG } from "./feature-acceptance-contracts";
import { defaultInputForSlug } from "./feature-inputs";
import { getFeatureDefinitions } from "./definitions";
import { executeFeatureService } from "./services";
import { getValidatedFeatures } from "./validate";
import { hasAcceptanceTest } from "./feature-test-registry";
import { implementationTierForSlug, tierAllowsLive } from "./feature-implementation-quality";

const FIXTURE_CTX = {
  userId: "00000000-0000-4000-8000-000000000001",
  favorites: [550, 680],
  history: [550, 13],
  watchlist: [680, 155],
};

describe("LIVE feature runtime regression", () => {
  it("LIVE set matches contracted, tier-eligible features only", () => {
    const live = getValidatedFeatures().filter((f) => f.status === "live");
    for (const feature of live) {
      expect(hasAcceptanceTest(feature.slug)).toBe(true);
      expect(tierAllowsLive(implementationTierForSlug(feature.slug))).toBe(true);
      expect(CONTRACT_BY_SLUG.has(feature.slug)).toBe(true);
    }
    expect(live.length).toBe(200);
  });

  it("executes every LIVE slug with contract validation", async () => {
    const live = getValidatedFeatures().filter((f) => f.status === "live");

    for (const feature of live) {
      const def = getFeatureDefinitions().find((f) => f.slug === feature.slug)!;
      const input = defaultInputForSlug(feature.slug);
      const result = await executeFeatureService(def, input, FIXTURE_CTX);
      expect(isStubFeatureResult(result), `${feature.slug} returned stub: ${result.error}`).toBe(false);
      expect(isGenericHandlerResult(result), `${feature.slug} returned generic placeholder`).toBe(false);
      const contractError = validateAcceptanceContract(feature.slug, result);
      expect(contractError, `${feature.slug}: ${contractError}`).toBeNull();
    }
  }, 180_000);
});
