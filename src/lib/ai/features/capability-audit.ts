import type { FeatureDefinition, FeatureRunResult } from "./types";

export type FeatureCapabilityDimensions = {
  hasDefinition: boolean;
  hasService: boolean;
  hasApi: boolean;
  hasUi: boolean;
  hasTests: boolean;
  hasRealDataPath: boolean;
  hasExecutionPath: boolean;
};

const STUB_ERROR_PATTERNS = [
  /not implemented/i,
  /client_action_required/i,
  /^use \/copilot/i,
  /must be performed through the authenticated ui/i,
] as const;

function buildHonestStatusCaps(): Partial<Record<string, "beta" | "planned" | "degraded">> {
  return {};
}

/** Features with real execution but intentional limitations — cap LIVE status. */
export const HONEST_STATUS_CAPS: Partial<Record<string, "beta" | "planned" | "degraded">> = buildHonestStatusCaps();

export const FEATURE_LIMITATION_NOTES: Partial<Record<string, string>> = {
  "poster-generator": "Deterministic SVG concept card — not a generative image model.",
  "semantic-catalog": "Smart catalog search (keywords + catalog FTS) — not vector embeddings.",
  "vibe-search": "AI-assisted heuristic discovery over TMDB catalog metadata.",
  "cinema-agent": "Executes agent tools + evidence retrieval; generative reply requires a connected model in Copilot.",
  "post-reflection": "Structured reflection prompts with optional persistence to taste signals.",
  "taste-evolution": "Timeline requires taste snapshots or sufficient timestamped history.",
  "rewatch-probability": "Ordinal rewatch signals — not a calibrated probability score.",
};

export function hasCatalogDataPath(def: FeatureDefinition): boolean {
  return def.requiredData.includes("catalog") || def.sourceRequirements.includes("tmdb");
}

export function hasUserDataPath(def: FeatureDefinition): boolean {
  return def.requiredData.includes("user") || def.sourceRequirements.includes("user");
}

export function resolveApiPath(def: FeatureDefinition): string | null {
  if (def.api) return def.api;
  if (def.hasService) return `/api/ai/features/${def.slug}`;
  return null;
}

export function resolveUiPath(def: FeatureDefinition): string | null {
  if (def.href) return def.href;
  if (def.hasUi || def.hasService) return `/intelligence/${def.slug}`;
  return null;
}

export function evaluateFeatureCapabilities(def: FeatureDefinition): FeatureCapabilityDimensions {
  const apiPath = resolveApiPath(def);
  const uiPath = resolveUiPath(def);
  const hasRealDataPath =
    hasCatalogDataPath(def) ||
    hasUserDataPath(def) ||
    def.requiredData.includes("people") ||
    def.requiredData.includes("franchise");

  return {
    hasDefinition: Boolean(def.slug && def.title),
    hasService: def.hasService,
    hasApi: def.hasApi || Boolean(def.api) || (def.hasService && Boolean(apiPath)),
    hasUi: def.hasUi || Boolean(def.href) || (def.hasService && Boolean(uiPath)),
    hasTests: def.hasTests,
    hasRealDataPath,
    hasExecutionPath: def.hasService,
  };
}

export function isGenericHandlerResult(result: FeatureRunResult): boolean {
  const text = JSON.stringify(result.data ?? {}) + (result.error ?? "");
  if (result.data && typeof result.data === "object") {
    const data = result.data as Record<string, unknown>;
    if (data.route && !data.primary && !data.chronological && !data.dna && !data.results) {
      return true;
    }
    if (Array.isArray(data.prompts) && data.briefing && Object.keys(data).length <= 4) {
      return true;
    }
  }
  const GENERIC_OUTPUT_PATTERNS = [
    /metadata briefing included/i,
    /connect a chat model in Copilot/i,
    /Use Tonight for constraint-aware picks/i,
    /Open a movie room to analyze votes/i,
  ] as const;
  return GENERIC_OUTPUT_PATTERNS.some((p) => p.test(text));
}

export function isStubFeatureResult(result: FeatureRunResult): boolean {
  const text = `${result.error ?? ""} ${JSON.stringify(result.data ?? "")}`;
  if (STUB_ERROR_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (result.status === "unavailable" && /not implemented|use \/copilot|client_action_required/i.test(text)) {
    return true;
  }
  return false;
}

export function isLegitimateUnavailable(def: FeatureDefinition, result: FeatureRunResult): boolean {
  if (result.status !== "unavailable" && result.status !== "insufficient_data") return false;
  if (def.requiredModelCapabilities.includes("chat") && def.fallbackBehavior !== "unavailable") {
    return true;
  }
  if (result.status === "insufficient_data") return true;
  return false;
}

const STATUS_RANK = { planned: 0, degraded: 1, beta: 2, live: 3, error: 4 } as const;

export function applyHonestStatusCap<T extends { slug: string; status: keyof typeof STATUS_RANK }>(
  feature: T,
): T {
  const cap = HONEST_STATUS_CAPS[feature.slug];
  if (!cap) return feature;
  if (STATUS_RANK[feature.status] > STATUS_RANK[cap]) {
    return { ...feature, status: cap };
  }
  return feature;
}
