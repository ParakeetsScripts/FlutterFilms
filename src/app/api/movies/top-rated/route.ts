import { handleApi } from "@/lib/api";
import { getTopRatedMovies } from "@/lib/tmdb/movies";
import { parsePage } from "@/lib/validation";

export async function GET(request: Request) {
  return handleApi(() => getTopRatedMovies(parsePage(new URL(request.url).searchParams.get("page"))));
}
