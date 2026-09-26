import { handleApi } from "@/lib/api";
import { refreshMovieFromTmdb } from "@/lib/sync/tmdb-sync";
import { runImdbSync } from "@/lib/sync/imdb-sync";
import { parseMovieId, ValidationError } from "@/lib/validation";
import { getCatalogMovie } from "@/lib/sync/catalog";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const tmdbId = parseMovieId(id);
  const body = (await request.json().catch(() => ({}))) as { source?: string };
  return handleApi(async () => {
    if (body.source === "imdb") {
      await runImdbSync();
    } else if (body.source === "tmdb" || !body.source) {
      const outcome = await refreshMovieFromTmdb(tmdbId);
      if (outcome === "failed") throw new ValidationError("TMDB refresh failed.");
    } else {
      throw new ValidationError("Unknown source.");
    }
    const movie = await getCatalogMovie(tmdbId, { forceRefresh: true });
    if (!movie) throw new ValidationError("Movie not found.");
    return movie;
  });
}
