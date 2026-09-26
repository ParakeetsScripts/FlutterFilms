export type AgentSessionContext = {
  lastMovieId?: number | null;
  lastPersonId?: number | null;
  lastCollectionId?: number | null;
  lastRecommendationIds?: number[];
  lastQuery?: string | null;
};

export function mergeSessionContext(
  current: AgentSessionContext,
  update: Partial<AgentSessionContext>,
): AgentSessionContext {
  return {
    lastMovieId: update.lastMovieId ?? current.lastMovieId ?? null,
    lastPersonId: update.lastPersonId ?? current.lastPersonId ?? null,
    lastCollectionId: update.lastCollectionId ?? current.lastCollectionId ?? null,
    lastRecommendationIds: update.lastRecommendationIds ?? current.lastRecommendationIds,
    lastQuery: update.lastQuery ?? current.lastQuery ?? null,
  };
}

export function inferSessionUpdatesFromTools(
  results: Array<{ name: string; result: unknown }>,
): Partial<AgentSessionContext> {
  const update: Partial<AgentSessionContext> = {};
  for (const entry of results) {
    const r = entry.result as Record<string, unknown> | null;
    if (!r) continue;
    if (entry.name === "getMovie" && typeof r.id === "number") {
      update.lastMovieId = r.id;
    }
    if (entry.name === "getPerson" && typeof r.id === "number") {
      update.lastPersonId = r.id;
    }
    if ((entry.name === "getFranchise" || entry.name === "getCollection") && typeof r.id === "number") {
      update.lastCollectionId = r.id;
    }
    if (entry.name === "recommendMovies") {
      const data = (r.data as Record<string, unknown>) ?? r;
      const primary = data.primary as { id?: number } | undefined;
      const movies = (data.movies as Array<{ id: number }>) ?? [];
      update.lastRecommendationIds = [
        ...(primary?.id ? [primary.id] : []),
        ...movies.map((m) => m.id),
      ].slice(0, 12);
      if (primary?.id) update.lastMovieId = primary.id;
    }
    if (entry.name === "searchMovies" || entry.name === "searchByVibe") {
      const resultsList = (r.results as Array<{ id: number }>) ?? [];
      if (resultsList[0]?.id) update.lastMovieId = resultsList[0].id;
    }
  }
  return update;
}
