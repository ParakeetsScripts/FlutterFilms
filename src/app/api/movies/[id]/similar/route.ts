import { handleApi } from "@/lib/api";
import { getSimilarMovies } from "@/lib/tmdb/similar";
import { parseMovieId, parsePage } from "@/lib/validation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const page = parsePage(new URL(request.url).searchParams.get("page"));
  return handleApi(() => getSimilarMovies(parseMovieId(id), page));
}
