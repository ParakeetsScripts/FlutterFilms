import { describe, expect, it, vi } from "vitest";
import { planAgentTools } from "./planner";
import { mergeSessionContext } from "./session-context";

vi.mock("@/lib/sync/catalog", () => ({
  searchCatalog: vi.fn(async () => ({ results: [{ id: 157336, title: "Interstellar", year: 2014 }] })),
}));

vi.mock("@/lib/tmdb/client", () => ({
  tmdbFetch: vi.fn(async () => ({ results: [{ id: 525, name: "Christopher Nolan" }] })),
}));

describe("Cinema Agent orchestration", () => {
  it("plans person lookup from Nolan alias", async () => {
    const { resolveEntities } = await import("./entities");
    const entities = await resolveEntities("Tell me about Nolan");
    const tools = planAgentTools("Tell me about Nolan", entities);
    expect(entities.personId).toBe(525);
    expect(tools.some((t) => t.name === "getPerson")).toBe(true);
  });

  it("plans watchlist mutation from natural language", () => {
    const tools = planAgentTools("Add movie 157336 to my watchlist", { movieId: 157336 });
    expect(tools.some((t) => t.name === "createWatchlistEntry")).toBe(true);
  });

  it("merges session context from tool results", () => {
    const next = mergeSessionContext(
      {},
      { lastMovieId: 550, lastRecommendationIds: [550, 680] },
    );
    expect(next.lastMovieId).toBe(550);
    expect(next.lastRecommendationIds).toEqual([550, 680]);
  });

  it("plans memory recall for preference questions", () => {
    const tools = planAgentTools("What kind of movies do I like?");
    expect(tools.some((t) => t.name === "getMemories")).toBe(true);
  });
});
