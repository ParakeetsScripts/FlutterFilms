export type TrustKind = "verified" | "metadata" | "user" | "external" | "ai_interpretation" | "ai_prediction";

export type TrustLabel = {
  kind: TrustKind;
  text: string;
  source?: string;
  updatedAt?: string;
};

export const TRUST_COPY: Record<TrustKind, string> = {
  verified: "Verified catalog fact",
  metadata: "Database metadata",
  user: "Your opinion",
  external: "External source",
  ai_interpretation: "AI interpretation",
  ai_prediction: "AI prediction — not a fact",
};

export function trustBadge(kind: TrustKind): TrustLabel {
  return { kind, text: TRUST_COPY[kind] };
}

export function wrapAiOutput(content: string, kind: TrustKind = "ai_interpretation"): { content: string; label: TrustLabel } {
  return { content, label: trustBadge(kind) };
}
