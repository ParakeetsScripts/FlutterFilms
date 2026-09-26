import { handleApi } from "@/lib/api";
import { resolvePlayback } from "@/lib/playback/resolver";
import { parseMovieId, parseRegion } from "@/lib/validation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const region = parseRegion(new URL(request.url).searchParams.get("region")) ?? "US";
  return handleApi(() => resolvePlayback(parseMovieId(id), region));
}
