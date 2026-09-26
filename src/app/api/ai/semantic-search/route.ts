import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { semanticSearch } from "@/lib/ai/intelligence/semantic-search";

export async function POST(request: Request) {
  rateLimit(`ai-semantic:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const body = (await request.json()) as {
      query?: string;
      kind?: "scene" | "visual" | "structure" | "pacing" | "arc" | "relationship" | "general";
    };
    if (!body.query?.trim()) throw new Error("Query required.");
    return semanticSearch(body.query, body.kind ?? "general");
  });
}
