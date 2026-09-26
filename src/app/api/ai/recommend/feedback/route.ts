import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { recordRecommendationFeedback, type RecommendationFeedback } from "@/lib/ai/recommendations-repository";

export async function POST(request: Request) {
  rateLimit(`ai-feedback:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const body = (await request.json()) as {
      movieId?: number;
      eventId?: string;
      userId?: string;
      feedback?: RecommendationFeedback;
    };
    if (!body.movieId || !body.feedback) throw new Error("movieId and feedback required");
    await recordRecommendationFeedback({
      movieId: body.movieId,
      eventId: body.eventId,
      userId: body.userId,
      feedback: body.feedback,
    });
    return { ok: true };
  });
}
