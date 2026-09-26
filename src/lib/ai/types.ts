export type AiProviderKind = "ollama" | "openai_compatible" | "openai" | "anthropic" | "google" | "custom";
export type AiCostType = "no_api_credits" | "api_metered" | "infrastructure";
export type AiHealthStatus = "connected" | "offline" | "degraded" | "unknown";
export type AiWeightClass = "open" | "closed" | "experimental";

export type AiCapabilities = {
  reasoning: boolean;
  vision: boolean;
  coding: boolean;
  tools: boolean;
  imageGen: boolean;
  videoGen: boolean;
};

export type AiProvider = {
  id: string;
  name: string;
  kind: AiProviderKind;
  endpoint: string | null;
  enabled: boolean;
  local: boolean;
  healthStatus: AiHealthStatus;
  lastChecked: string | null;
  latencyMs: number | null;
  errorRate: number;
  requestCount: number;
};

export type AiModel = {
  id: string;
  providerId: string;
  name: string;
  apiModelId: string;
  description: string | null;
  local: boolean;
  openWeight: boolean;
  license: string | null;
  weightClass: AiWeightClass;
  capabilities: AiCapabilities;
  contextWindow: number | null;
  costType: AiCostType;
  enabled: boolean;
  healthStatus: AiHealthStatus;
  sizeBytes: number | null;
  loaded: boolean | null;
  speedTier: "fast" | "balanced" | "quality" | null;
  category: "chat" | "reasoning" | "coding" | "vision" | "image" | "video" | "experimental";
  lastChecked: string | null;
  requestCount: number;
  errorCount: number;
};

export type AutoRouteTarget =
  | "fast_local"
  | "local_reasoning"
  | "local_coding"
  | "cloud_advanced"
  | "vision"
  | "image"
  | "video";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelUsageRecord = {
  modelId: string;
  providerId: string;
  local: boolean;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  success: boolean;
  costType: AiCostType;
  createdAt: string;
};
