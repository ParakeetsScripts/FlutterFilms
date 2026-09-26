import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { buildPersonalityCard, buildTasteExplanations, computeTasteDna, rewatchCandidates, tasteContradictions } from "@/lib/ai/intelligence/taste";

export async function POST(request: Request) {
  rateLimit(`ai-taste:${clientKey(request)}`, 20);
  return handleApi(async () => {
    const body = (await request.json()) as { movieIds?: number[]; favorites?: number[] };
    const ids = body.movieIds ?? [];
    if (!ids.length) return { error: "No movies to analyze." };
    const dna = await computeTasteDna(ids);
    return {
      dna,
      explanations: buildTasteExplanations(dna, (body.favorites ?? []).length),
      contradictions: tasteContradictions(dna),
      personality: buildPersonalityCard(dna),
      rewatchCandidates: rewatchCandidates(ids, body.favorites ?? []),
    };
  });
}
