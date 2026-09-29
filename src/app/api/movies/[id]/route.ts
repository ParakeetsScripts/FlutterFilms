import { handleApi } from "@/lib/api";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { getMovie } from "@/lib/tmdb/movies";
import { ValidationError } from "@/lib/validation";
import { parseMovieId, parseRegion } from "@/lib/validation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const catalog = await getServerCatalogPreferences();
  const region = parseRegion(params.get("region")) ?? catalog.region;
  const language = params.get("language") ?? catalog.uiLanguage;
  return handleApi(async () => {
    const movie = await getMovie(parseMovieId(id), { region, language });
    if (!movie) throw new ValidationError("Movie not found.");
    return movie;
  });
}
