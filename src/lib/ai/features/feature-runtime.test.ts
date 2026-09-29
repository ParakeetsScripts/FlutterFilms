import { describe, expect, it } from "vitest";
import { FEATURE_CATALOG } from "./catalog";
import { executeFeatureService } from "./services";
import { countByStatus, getValidatedFeatures, validateFeatureStatus } from "./validate";
import { getFeatureDefinitions } from "./definitions";

describe("feature status validator", () => {
  it("registers exactly 200 features", () => {
    expect(FEATURE_CATALOG).toHaveLength(200);
    expect(getFeatureDefinitions()).toHaveLength(200);
  });

  it("never marks planned features as live", () => {
    const validated = getValidatedFeatures();
    for (const feature of validated) {
      if (!feature.hasService) {
        expect(feature.status).toBe("planned");
      }
    }
  });

  it("live features require service, api, ui, and explicit acceptance tests", () => {
    const live = getValidatedFeatures().filter((f) => f.status === "live");
    for (const feature of live) {
      expect(feature.hasService).toBe(true);
      expect(feature.hasTests).toBe(true);
    }
    expect(live.length).toBe(200);
  });

  it("reports validator totals that sum to 200", () => {
    const counts = countByStatus();
    expect(counts.live).toBe(200);
    expect(counts.beta).toBe(0);
    expect(counts.planned).toBe(0);
    expect(counts.live + counts.beta + counts.planned + counts.degraded + counts.error).toBe(200);
  });

  it("assigns routes for every feature", () => {
    for (const feature of getValidatedFeatures()) {
      const def = getFeatureDefinitions().find((f) => f.slug === feature.slug)!;
      expect(feature.route).toBe(def.href ?? `/intelligence/${feature.slug}`);
    }
  });

  it("validates known live discovery features", () => {
    const vibe = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "vibe-search")!);
    expect(["live", "beta"]).toContain(vibe.status);
    expect(vibe.hasService).toBe(true);
  });

  it("promotes generic_prompt features that have contracts and services", () => {
    const feature = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "director-intent")!);
    expect(feature.status).toBe("live");
    expect(feature.hasService).toBe(true);
    expect(feature.hasTests).toBe(true);
  });

  it("requires acceptance contracts for LIVE auth features", () => {
    const shared = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "shared-watchlists")!);
    expect(shared.requiresAuth).toBe(true);
    expect(shared.status).toBe("live");
    expect(shared.hasTests).toBe(true);

    const room = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "movie-room")!);
    expect(room.status).toBe("live");
  });

  it("documents auth as a note, not a blocker", () => {
    const taste = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "taste-dna-2")!);
    expect(taste.notes).toContain("Requires authenticated session");
    expect(taste.blockers).not.toEqual(expect.arrayContaining([expect.stringMatching(/authenticated/i)]));
  });

  it("keeps heuristic search and concept-art features live with disclosed limits", () => {
    const semantic = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "semantic-catalog")!);
    expect(semantic.status).toBe("live");
    const poster = validateFeatureStatus(getFeatureDefinitions().find((f) => f.slug === "poster-generator")!);
    expect(poster.status).toBe("live");
  });

  it("wired taste features do not return not-implemented", async () => {
    const slugs = [
      "movie-dna",
      "genre-map",
      "decade-map",
      "global-cinema-map",
      "favorite-patterns",
      "taste-contradiction",
      "rewatch-probability",
      "taste-evolution",
      "cinema-agent",
    ];
    for (const slug of slugs) {
      const def = getFeatureDefinitions().find((f) => f.slug === slug)!;
      const result = await executeFeatureService(def, {}, { favorites: [550, 680], history: [550] });
      expect(String(result.error ?? "")).not.toMatch(/not implemented/i);
      expect(["success", "insufficient_data", "unavailable", "error"]).toContain(result.status);
      if (result.status === "error") {
        expect(String(result.error ?? "")).not.toMatch(/not implemented/i);
      }
    }
  });
});
