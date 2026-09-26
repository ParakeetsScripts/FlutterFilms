import { handleApi } from "@/lib/api";
import { getMovieCredits } from "@/lib/tmdb/credits";
import { parseMovieId } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleApi(() => getMovieCredits(parseMovieId(id)));
}
