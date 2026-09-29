import { AuthError } from "@/lib/auth/errors";
import { DatabaseUnavailableError } from "@/lib/db/errors";
import { isInfrastructureError, sanitizePublicErrorMessage } from "@/lib/errors/public-message";
import { errorCategoryFromError, reportProductionError } from "@/lib/errors/report";
import { TmdbConfigError, TmdbUnavailableError } from "@/lib/tmdb/client";
import { ValidationError } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const searchHits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  if (process.env.PLAYWRIGHT === "1" || process.env.E2E_RATE_LIMIT_OFF === "1") {
    return;
  }
  const now = Date.now();
  const current = searchHits.get(key);
  if (!current || now > current.resetAt) {
    searchHits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    throw new ValidationError("Too many requests. Please wait a moment.");
  }
}

export function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function handleApi<T>(fn: () => Promise<T>, meta?: { route?: string; feature?: string }) {
  const requestId = randomUUID();
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (error) {
    const category = errorCategoryFromError(error);
    if (!(error instanceof ValidationError) && !(error instanceof AuthError)) {
      void reportProductionError({
        requestId,
        route: meta?.route,
        feature: meta?.feature,
        category,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 401 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 400 });
    }
    if (error instanceof DatabaseUnavailableError) {
      const context = meta?.route?.includes("onboarding") ? "save" : "generic";
      return NextResponse.json(
        { error: sanitizePublicErrorMessage(error.message, context), requestId },
        { status: 503 },
      );
    }
    if (error instanceof TmdbConfigError) {
      return NextResponse.json(
        { error: sanitizePublicErrorMessage(error.message, "movieData"), requestId },
        { status: 503 },
      );
    }
    if (error instanceof TmdbUnavailableError) {
      return NextResponse.json(
        { error: sanitizePublicErrorMessage(error.message, "movieData"), requestId },
        { status: 503 },
      );
    }
    if (error instanceof Error && error.message) {
      const context = meta?.route?.includes("onboarding") ? "save" : "generic";
      const status = isInfrastructureError(error.message) ? 503 : 400;
      return NextResponse.json(
        { error: sanitizePublicErrorMessage(error.message, context), requestId },
        { status },
      );
    }
    return NextResponse.json(
      { error: sanitizePublicErrorMessage(null, "generic"), requestId },
      { status: 503 },
    );
  }
}
