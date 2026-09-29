import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { listRecentFeedback, saveUserFeedback } from "@/lib/feedback/repository";

export async function POST(request: Request) {
  rateLimit(`feedback:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const body = (await request.json()) as { category?: string; message?: string };
    const result = await saveUserFeedback({
      category: body.category,
      message: body.message ?? "",
    });
    return { ok: true, id: result.id, storage: result.storage };
  }, { route: "/api/feedback" });
}

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  return handleApi(async () => {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
    const feedback = await listRecentFeedback(Math.min(limit, 200));
    return { count: feedback.length, feedback };
  }, { route: "/api/feedback" });
}
