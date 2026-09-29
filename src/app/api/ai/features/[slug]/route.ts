import { handleApi } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { getFeatureHealth } from "@/lib/ai/features/health";
import { getIntelligenceFeature } from "@/lib/ai/features/registry";
import { runFeature } from "@/lib/ai/features/runtime";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const feature = getIntelligenceFeature(slug);
  if (!feature) {
    return NextResponse.json({ error: "Feature not found." }, { status: 404 });
  }
  return handleApi(async () => ({
    feature,
    health: await getFeatureHealth(slug),
  }));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  try {
    const body = (await request.json()) as {
      input?: Record<string, unknown>;
      watchlist?: number[];
      favorites?: number[];
      history?: number[];
    };
    const user = await getSessionUser();
    const result = await runFeature(slug, body.input ?? {}, {
      userId: user?.id,
      watchlist: body.watchlist,
      favorites: body.favorites,
      history: body.history,
    });
    return NextResponse.json(result);
  } catch (error) {
    const { sanitizePublicErrorMessage } = await import("@/lib/errors/public-message");
    return NextResponse.json(
      { error: sanitizePublicErrorMessage(error instanceof Error ? error.message : "Feature run failed.", "generic") },
      { status: 500 },
    );
  }
}
