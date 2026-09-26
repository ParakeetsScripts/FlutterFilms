import { handleApi } from "@/lib/api";
import { getMovie } from "@/lib/tmdb/movies";
import { parseMovieId, parseRegion } from "@/lib/validation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const region = parseRegion(new URL(request.url).searchParams.get("region")) ?? "US";
  return handleApi(async () => {
    const movie = await getMovie(parseMovieId(id), { region });
    if (!movie) throw new Error("not found");
    return movie;
  });
}
