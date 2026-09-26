import "server-only";

import { listRecommendationFeedback } from "@/lib/ai/recommendations-repository";
import { getUserTasteEvidence } from "@/lib/ai/evidence/user";
import { getUserLibrary } from "./library-repository";
import { listTasteSignals, listTasteSnapshots } from "./taste-repository";
import { listAgentMemories, memoriesToAgentShape } from "./agent-memory-service";

export type UnifiedTasteContext = {
  userId: string;
  favorites: number[];
  history: number[];
  watchlist: number[];
  feedback: Array<{ movieId: number; feedback: string }>;
  tasteSignals: Awaited<ReturnType<typeof listTasteSignals>>;
  tasteSnapshots: Awaited<ReturnType<typeof listTasteSnapshots>>;
  agentMemory: ReturnType<typeof memoriesToAgentShape>;
  settings: Record<string, unknown>;
  evidence: Awaited<ReturnType<typeof getUserTasteEvidence>>;
};

export async function getUserTasteContext(userId: string): Promise<UnifiedTasteContext> {
  const library = await getUserLibrary(userId);
  const [feedback, tasteSignals, tasteSnapshots, memories] = await Promise.all([
    listRecommendationFeedback(userId).catch(() => []),
    listTasteSignals(userId).catch(() => []),
    listTasteSnapshots(userId, 6).catch(() => []),
    listAgentMemories(userId).catch(() => []),
  ]);

  const historyIds = library.history.map((h) => h.movieId);
  const evidence = await getUserTasteEvidence({
    userId,
    favorites: library.favorites,
    history: historyIds,
    watchlist: library.watchlist,
  });

  return {
    userId,
    favorites: library.favorites,
    history: historyIds,
    watchlist: library.watchlist,
    feedback,
    tasteSignals,
    tasteSnapshots,
    agentMemory: memoriesToAgentShape(memories),
    settings: library.settings,
    evidence,
  };
}
