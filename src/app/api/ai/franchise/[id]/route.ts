import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { analyzeFranchise } from "@/lib/ai/intelligence/franchise";
import { parseMovieId } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  rateLimit(`ai-franchise:${clientKey(request)}`, 20);
  const collectionId = parseMovieId((await params).id);
  const body = (await request.json()) as { watchedIds?: number[] };
  return handleApi(() => analyzeFranchise(collectionId, body.watchedIds ?? []));
}
