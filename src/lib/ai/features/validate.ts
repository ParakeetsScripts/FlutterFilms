import { getFeatureDefinitions } from "./definitions";
import type { FeatureDefinition, FeatureHealthStatus } from "./types";

export type ValidatedFeature = FeatureDefinition & {
  status: FeatureHealthStatus;
  blockers: string[];
  notes: string[];
  route: string;
};

function effectiveFlags(def: FeatureDefinition) {
  return {
    // Generic runner: /api/ai/features/[slug]
    hasApi: def.hasApi || Boolean(def.api) || def.hasService,
    hasUi: def.hasUi || Boolean(def.href),
  };
}

/** Issues that prevent LIVE status — auth is never one of these. */
function productionBlockers(def: FeatureDefinition): string[] {
  const flags = effectiveFlags(def);
  const issues: string[] = [];
  if (!def.hasService) issues.push("No service implementation");
  if (!flags.hasApi && def.hasService) issues.push("No API route");
  if (!flags.hasUi) issues.push("No dedicated UI");
  if (!def.hasTests) issues.push("No acceptance tests");
  if (def.requiredModelCapabilities.includes("chat") && def.fallbackBehavior === "unavailable") {
    issues.push("Requires chat model with no fallback");
  }
  if (def.requiredModelCapabilities.includes("image") && def.fallbackBehavior === "unavailable") {
    issues.push("Requires image provider with no fallback");
  }
  if (def.requiredModelCapabilities.includes("video") && def.fallbackBehavior === "unavailable") {
    issues.push("Requires video provider with no fallback");
  }
  return issues;
}

function productionNotes(def: FeatureDefinition): string[] {
  const notes: string[] = [];
  if (def.requiresAuth) notes.push("Requires authenticated session");
  if (def.requiredModelCapabilities.includes("chat") && def.fallbackBehavior !== "unavailable") {
    notes.push("AI chat enhances experience; degrades without provider");
  }
  if (def.requiredModelCapabilities.includes("image")) notes.push("Image generation requires configured provider");
  if (def.requiredModelCapabilities.includes("video")) notes.push("Video generation requires configured provider");
  return notes;
}

export function validateFeatureStatus(def: FeatureDefinition): ValidatedFeature {
  const blockers = productionBlockers(def);
  const notes = productionNotes(def);
  let status: FeatureHealthStatus = "planned";

  const flags = effectiveFlags(def);
  const coreReady = def.hasService && flags.hasApi && flags.hasUi && def.hasTests;
  const partialReady = def.hasService && (flags.hasApi || flags.hasUi);

  if (!def.hasService) {
    status = "planned";
  } else if (coreReady && blockers.length === 0) {
    status = "live";
  } else if (partialReady) {
    status = "beta";
  } else {
    status = "planned";
  }

  return {
    ...def,
    status,
    blockers,
    notes,
    route: def.href ?? `/intelligence/${def.slug}`,
  };
}

export function getValidatedFeatures(): ValidatedFeature[] {
  return getFeatureDefinitions().map(validateFeatureStatus);
}

export function countByStatus() {
  const features = getValidatedFeatures();
  return {
    live: features.filter((f) => f.status === "live").length,
    degraded: features.filter((f) => f.status === "degraded").length,
    beta: features.filter((f) => f.status === "beta").length,
    planned: features.filter((f) => f.status === "planned").length,
    error: features.filter((f) => f.status === "error").length,
  };
}
