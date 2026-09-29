import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { buildMovieBriefing, type SpoilerLevel } from "@/lib/ai/intelligence/briefing";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { parseMovieId } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  rateLimit(`ai-briefing:${clientKey(request)}`, 40);
  const movieId = parseMovieId((await params).id);
  const spoiler = (new URL(request.url).searchParams.get("spoiler") ?? "none") as SpoilerLevel;
  const catalog = await getServerCatalogPreferences();
  return handleApi(async () => {
    const briefing = await buildMovieBriefing(movieId, spoiler, {
      language: catalog.uiLanguage,
      region: catalog.region,
    });
    if (!briefing) throw new Error("Movie not found.");
    return briefing;
  });
}
