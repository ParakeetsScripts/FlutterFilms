import { handleApi } from "@/lib/api";
import { getNowPlayingMovies } from "@/lib/tmdb/movies";
import { parsePage, parseRegion } from "@/lib/validation";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return handleApi(() => getNowPlayingMovies(parsePage(params.get("page")), parseRegion(params.get("region"))));
}
