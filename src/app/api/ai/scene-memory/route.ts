import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { searchSceneMemory } from "@/lib/ai/intelligence/scene-memory";

export async function POST(request: Request) {
  rateLimit(`scene-memory:${clientKey(request)}`, 30);
  return handleApi(async () => {
    const body = (await request.json()) as { parts?: string[]; query?: string };
    const parts = body.parts ?? (body.query ? [body.query] : []);
    if (!parts.filter(Boolean).length) throw new Error("Describe what you remember.");
    return searchSceneMemory(parts);
  });
}
