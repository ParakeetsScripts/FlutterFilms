import type { FeatureCategory } from "./catalog";
import type { TrustLabel } from "../trust";

export type FeatureHealthStatus = "live" | "degraded" | "beta" | "planned" | "error";

export type ModelCapability = "chat" | "reasoning" | "vision" | "image" | "video";

export type FeatureDefinition = {
  id: number;
  slug: string;
  title: string;
  category: FeatureCategory;
  description: string;
  href?: string;
  api?: string;
  requiredData: ("catalog" | "user" | "auth" | "people" | "franchise")[];
  requiredModelCapabilities: ModelCapability[];
  requiresAuth: boolean;
  hasService: boolean;
  hasApi: boolean;
  hasUi: boolean;
  hasTests: boolean;
  sourceRequirements: ("tmdb" | "imdb" | "user" | "ai")[];
  cachePolicy: "none" | "short" | "long";
  fallbackBehavior: "unavailable" | "metadata_only" | "graceful_message";
};

export type FeatureRunInput = Record<string, unknown>;

export type FeatureRunResult = {
  featureId: number;
  slug: string;
  status: "success" | "unavailable" | "insufficient_data" | "error";
  data?: unknown;
  labels: TrustLabel[];
  explanation?: string[];
  modelUsed?: string | null;
  error?: string;
  ranAt: string;
};

export type FeatureHealth = {
  id: number;
  slug: string;
  title: string;
  status: FeatureHealthStatus;
  computedStatus: FeatureHealthStatus;
  hasService: boolean;
  hasApi: boolean;
  hasUi: boolean;
  hasTests: boolean;
  lastRunAt?: string | null;
  lastError?: string | null;
  executionCount: number;
  failureRate: number;
  requirements: {
    data: string[];
    models: ModelCapability[];
    auth: boolean;
  };
  blockers: string[];
};
