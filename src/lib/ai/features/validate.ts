import { evaluateFeatureCapabilities, applyHonestStatusCap, FEATURE_LIMITATION_NOTES, resolveApiPath, resolveUiPath } from "./capability-audit";
import { getFeatureDefinitions } from "./definitions";
import type { FeatureDefinition, FeatureHealthStatus } from "./types";

export type ValidatedFeature = FeatureDefinition & {
  status: FeatureHealthStatus;
  blockers: string[];
  notes: string[];
  route: string;
  capabilities: ReturnType<typeof evaluateFeatureCapabilities>;
};

function productionBlockers(def: FeatureDefinition, caps: ReturnType<typeof evaluateFeatureCapabilities>): string[] {
  const issues: string[] = [];
  if (!caps.hasService) issues.push("No service implementation");
  if (!caps.hasApi) issues.push("No API route");
  if (!caps.hasUi) issues.push("No UI entry");
  if (!caps.hasTests) issues.push("No acceptance tests");
  if (!caps.hasRealDataPath && def.hasService) issues.push("No verified data path");
  if (!caps.hasExecutionPath) issues.push("No execution path");
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
  const limitation = FEATURE_LIMITATION_NOTES[def.slug];
  if (limitation) notes.push(limitation);
  if (def.requiresAuth) notes.push("Requires authenticated session");
  if (def.requiredModelCapabilities.includes("chat") && def.fallbackBehavior !== "unavailable") {
    notes.push("Generative AI enhances experience; degrades without provider");
  }
  if (def.requiredModelCapabilities.includes("image")) notes.push("Image output uses concept builder unless generative provider configured");
  if (def.requiredModelCapabilities.includes("video")) notes.push("Video generation requires configured provider");
  const api = resolveApiPath(def);
  if (api && !def.api) notes.push(`API: ${api}`);
  return notes;
}

export function validateFeatureStatus(def: FeatureDefinition): ValidatedFeature {
  const capabilities = evaluateFeatureCapabilities(def);
  const blockers = productionBlockers(def, capabilities);
  const notes = productionNotes(def);
  let status: FeatureHealthStatus = "planned";

  const coreReady =
    capabilities.hasService &&
    capabilities.hasApi &&
    capabilities.hasUi &&
    capabilities.hasTests &&
    capabilities.hasRealDataPath &&
    capabilities.hasExecutionPath;

  const partialReady = capabilities.hasService && (capabilities.hasApi || capabilities.hasUi);

  if (!capabilities.hasService) {
    status = "planned";
  } else if (coreReady && blockers.length === 0) {
    status = "live";
  } else if (partialReady) {
    status = "beta";
  } else {
    status = "planned";
  }

  const validated = applyHonestStatusCap({
    ...def,
    status,
    blockers,
    notes,
    route: resolveUiPath(def) ?? `/intelligence/${def.slug}`,
    capabilities,
  });

  return validated;
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

export { isStubFeatureResult, evaluateFeatureCapabilities } from "./capability-audit";
