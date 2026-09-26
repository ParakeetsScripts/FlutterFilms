import { handleApi } from "@/lib/api";
import { getPopularMovies } from "@/lib/tmdb/movies";
import { parsePage } from "@/lib/validation";

export async function GET(request: Request) {
  const page = parsePage(new URL(request.url).searchParams.get("page"));
  return handleApi(() => getPopularMovies(page));
}
