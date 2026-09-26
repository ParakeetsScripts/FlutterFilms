import { describe, expect, it } from "vitest";

import { isStubFeatureResult } from "./capability-audit";
import { getFeatureDefinitions } from "./definitions";
import { executeFeatureService } from "./services";
import { getValidatedFeatures } from "./validate";

const FIXTURE_CTX = {
  userId: "test-user",
  favorites: [550, 680],
  history: [550, 13],
  watchlist: [680],
};

const FIXTURE_INPUT: Record<string, Record<string, unknown>> = {
  "movie-briefing": { movieId: 550 },
  "franchise-completion": { collectionId: 9485 },
  "post-reflection": { movieId: 550, reflection: { mood: "thoughtful", wouldRewatch: true } },
  "cinema-agent": { message: "Recommend a sci-fi movie under 150 minutes" },
  "actor-similarity": { personId: 525 },
};

describe("LIVE feature runtime regression", () => {
  it("has a smaller honest LIVE set than inflated registry", () => {
    const counts = getValidatedFeatures().reduce(
      (acc, f) => {
        acc[f.status] = (acc[f.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    expect(counts.live ?? 0).toBeLessThan(45);
    expect((counts.beta ?? 0) + (counts.live ?? 0)).toBeGreaterThan(50);
  });

  it("never marks planned slugs as live", () => {
    const planned = getValidatedFeatures().filter((f) => f.status === "planned");
    expect(planned.some((f) => f.slug === "director-intent")).toBe(true);
    for (const feature of planned) {
      expect(feature.capabilities.hasService).toBe(false);
    }
  });

  it("executes every LIVE slug without stub responses", async () => {
    const live = getValidatedFeatures().filter((f) => f.status === "live");
    expect(live.length).toBeGreaterThan(10);

    for (const feature of live) {
      const def = getFeatureDefinitions().find((f) => f.slug === feature.slug)!;
      const input = FIXTURE_INPUT[feature.slug] ?? {};
      const result = await executeFeatureService(def, input, FIXTURE_CTX);
      expect(isStubFeatureResult(result), `${feature.slug} returned stub: ${result.error}`).toBe(false);
      expect(["success", "insufficient_data"], `${feature.slug} -> ${result.status}: ${result.error}`).toContain(
        result.status,
      );
      if (result.status === "success") expect(result.data).toBeDefined();
    }
  }, 120_000);
});
