import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { recordAnalyticsEvent, touchSession } from "@/lib/analytics/repository";
import { canonicalEventName, type AnalyticsEventName } from "@/lib/analytics/events";
import { getSessionUser } from "@/lib/auth/session";
import { DatabaseUnavailableError } from "@/lib/db/errors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    rateLimit(`analytics:${clientKey(request)}`, 120);
  } catch (error) {
    return handleApi(async () => {
      throw error;
    }, { route: "/api/analytics/track", feature: "analytics" });
  }

  try {
    const body = (await request.json()) as {
      name?: AnalyticsEventName;
      properties?: Record<string, unknown>;
      path?: string;
      sessionId?: string;
    };
    if (!body.name) {
      return NextResponse.json({ error: "Event name required." }, { status: 400 });
    }

    const user = await getSessionUser();
    const sessionId = body.sessionId ?? null;
    if (sessionId) {
      await touchSession(
        sessionId,
        user?.id,
        request.headers.get("user-agent") ?? undefined,
        request.headers.get("referer") ?? undefined,
      );
    }

    await recordAnalyticsEvent({
      name: canonicalEventName(body.name),
      userId: user?.id,
      sessionId,
      path: body.path,
      properties: body.properties as Record<string, string | number | boolean | null | undefined>,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Telemetry must never break the UI — serverless deploys often lack a writable database.
    if (error instanceof DatabaseUnavailableError || process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: true, skipped: true });
    }
    return handleApi(async () => {
      throw error;
    }, { route: "/api/analytics/track", feature: "analytics" });
  }
}
