const INFRA_PATTERNS = [
  /exceeded the quota/i,
  /account or project has exceeded/i,
  /upgrade your plan/i,
  /rate limit/i,
  /too many requests/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /database/i,
  /postgres/i,
  /neon/i,
  /sqlite/i,
  /temporarily unavailable/i,
  /service unavailable/i,
  /internal server error/i,
  /tmdb/i,
  /api_key/i,
  /api token/i,
];

const DEFAULT_MESSAGES = {
  generic: "Something went wrong. Please try again in a moment.",
  movieData: "Movie data is temporarily unavailable. Please try again shortly.",
  save: "We couldn't sync right now. Your choices are saved on this device — try again later.",
  network: "Network error. Your selections are saved on this device.",
} as const;

export function isInfrastructureError(message: string | undefined | null): boolean {
  if (!message) return false;
  return INFRA_PATTERNS.some((pattern) => pattern.test(message));
}

export function sanitizePublicErrorMessage(
  message: string | undefined | null,
  context: "generic" | "movieData" | "save" | "network" = "generic",
): string {
  if (!message?.trim()) return DEFAULT_MESSAGES[context];

  const trimmed = message.trim();

  if (isInfrastructureError(trimmed)) {
    return DEFAULT_MESSAGES[context];
  }

  if (trimmed.length > 180 || /^[A-Z_]+:/.test(trimmed) || /stack|trace|sql/i.test(trimmed)) {
    return DEFAULT_MESSAGES[context];
  }

  return trimmed;
}

export function readApiError(
  payload: unknown,
  context: "generic" | "movieData" | "save" | "network" = "generic",
): string | null {
  if (!payload || typeof payload !== "object") return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "string" || !error.trim()) return null;
  return sanitizePublicErrorMessage(error, context);
}
