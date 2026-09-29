import { handleApi } from "@/lib/api";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { getMovie } from "@/lib/tmdb/movies";
import { prioritizeVideos } from "@/lib/tmdb/videos";
import { fetchMovieVideos } from "@/lib/tmdb/videos.server";
import { parseMovieId } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const catalog = await getServerCatalogPreferences();
  const movieId = parseMovieId(id);
  return handleApi(async () => {
    const movie = await getMovie(movieId, { language: catalog.uiLanguage, region: catalog.region });
    const videos = movie?.videos?.length
      ? movie.videos
      : await fetchMovieVideos(movieId, catalog.uiLanguage);
    return prioritizeVideos(videos);
  });
}
