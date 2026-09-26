import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { analyzePerson, findSimilarPeople } from "@/lib/ai/intelligence/people";
import { parseMovieId } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  rateLimit(`ai-people:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const id = parseMovieId((await params).id);
    const url = new URL(request.url);
    const similar = url.searchParams.get("similar");
    if (similar === "actor" || similar === "director") {
      return findSimilarPeople(id, similar);
    }
    return analyzePerson(id);
  });
}
