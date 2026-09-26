import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { recordAnalyticsEvent, touchSession } from "@/lib/analytics/repository";
import { canonicalEventName, type AnalyticsEventName } from "@/lib/analytics/events";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  rateLimit(`analytics:${clientKey(request)}`, 120);
  return handleApi(async () => {
    const body = (await request.json()) as {
      name?: AnalyticsEventName;
      properties?: Record<string, unknown>;
      path?: string;
      sessionId?: string;
    };
    if (!body.name) throw new Error("Event name required.");

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

    return { ok: true };
  });
}
