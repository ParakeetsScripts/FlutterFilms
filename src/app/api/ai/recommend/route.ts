import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { runRecommendation, type RecommendMode } from "@/lib/ai/intelligence/recommendations";
import { buildRecommendationExplanation } from "@/lib/ai/explain";
import { recordRecommendationEvent } from "@/lib/ai/recommendations-repository";
import { getSessionUser } from "@/lib/auth/session";
import { listTasteSignals } from "@/lib/user/taste-repository";
import { moviePath } from "@/lib/slug";

export async function POST(request: Request) {
  rateLimit(`ai-recommend:${clientKey(request)}`, 30);
  return handleApi(async () => {
    const body = (await request.json()) as {
      mode?: RecommendMode;
      watchlist?: number[];
      favorites?: number[];
      history?: number[];
      maxRuntime?: number;
      energy?: "low" | "balanced" | "high";
      brain?: "casual" | "thoughtful" | "complex" | "extreme";
    };
    const result = await runRecommendation({
      mode: body.mode ?? "instant",
      watchlist: body.watchlist ?? [],
      favorites: body.favorites ?? [],
      history: body.history ?? [],
      maxRuntime: body.maxRuntime,
      energy: body.energy,
      brain: body.brain,
    });
    const session = await getSessionUser();
    const tasteSignals = session ? await listTasteSignals(session.id) : [];
    const explanation = buildRecommendationExplanation(tasteSignals);
    if (result.reason) explanation.unshift(result.reason);

    const eventId = result.primary
      ? await recordRecommendationEvent({
          userId: session?.id,
          movieId: result.primary.id,
          reason: result.reason,
          signals: { mode: body.mode ?? "instant", energy: body.energy, brain: body.brain, explanation },
        })
      : null;
    return {
      ...result,
      eventId,
      explanation: explanation.slice(0, 4),
      links: {
        primary: result.primary ? moviePath(result.primary.id, result.primary.title) : null,
        secondary: result.secondary ? moviePath(result.secondary.id, result.secondary.title) : null,
      },
    };
  });
}
