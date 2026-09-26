import { handleApi } from "@/lib/api";
import { getMovie } from "@/lib/tmdb/movies";
import { parseMovieId } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleApi(async () => {
    const movie = await getMovie(parseMovieId(id));
    return movie?.images ?? { posters: [], backdrops: [], logos: [] };
  });
}
