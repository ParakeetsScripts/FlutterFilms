import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { buildMovieBriefing, type SpoilerLevel } from "@/lib/ai/intelligence/briefing";
import { parseMovieId } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  rateLimit(`ai-briefing:${clientKey(request)}`, 40);
  const movieId = parseMovieId((await params).id);
  const spoiler = (new URL(request.url).searchParams.get("spoiler") ?? "none") as SpoilerLevel;
  return handleApi(async () => {
    const briefing = await buildMovieBriefing(movieId, spoiler);
    if (!briefing) throw new Error("Movie not found.");
    return briefing;
  });
}
