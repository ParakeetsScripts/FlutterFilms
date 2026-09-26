import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { buildTonightPick } from "@/lib/ai/intelligence/tonight";
import { recordRecommendationEvent } from "@/lib/ai/recommendations-repository";
import { getSessionUser } from "@/lib/auth/session";
import { getUserLibrary } from "@/lib/user/library-repository";
import { listTasteSignals } from "@/lib/user/taste-repository";

export async function POST(request: Request) {
  rateLimit(`tonight:${clientKey(request)}`, 20);
  return handleApi(async () => {
    const body = (await request.json()) as {
      minutes?: number;
      mood?: "low" | "balanced" | "high";
      attention?: "background" | "full";
      familiarity?: "familiar" | "different";
      language?: string;
      genreIds?: number[];
      region?: string;
      watchlist?: number[];
      favorites?: number[];
      history?: number[];
    };

    const session = await getSessionUser();
    let watchlist = body.watchlist ?? [];
    let favorites = body.favorites ?? [];
    let history = body.history ?? [];

    if (session) {
      const library = await getUserLibrary(session.id);
      if (!body.watchlist?.length) watchlist = library.watchlist;
      if (!body.favorites?.length) favorites = library.favorites;
      if (!body.history?.length) history = library.history.map((h) => h.movieId);
    }

    const tasteSignals = session ? await listTasteSignals(session.id) : [];
    const pick = await buildTonightPick(
      {
        minutes: body.minutes ?? 120,
        mood: body.mood ?? "balanced",
        attention: body.attention ?? "full",
        familiarity: body.familiarity ?? "familiar",
        language: body.language,
        genreIds: body.genreIds,
      },
      { watchlist, favorites, history },
      tasteSignals,
      body.region ?? "US",
    );

    if (!pick) return { error: "Not enough verified data for a pick." };

    const eventId = await recordRecommendationEvent({
      userId: session?.id,
      movieId: pick.primary.id,
      reason: pick.explanation.join("; "),
      signals: { feature: "tonight", mood: body.mood, minutes: body.minutes },
    });

    return { ...pick, eventId };
  });
}
