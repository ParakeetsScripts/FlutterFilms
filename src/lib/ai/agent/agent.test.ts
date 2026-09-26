import { describe, expect, it } from "vitest";
import { planAgentTools } from "./planner";

describe("Cinema Agent planner", () => {
  it("plans search for find queries", () => {
    const tools = planAgentTools("Find sci-fi movies like Arrival");
    expect(tools.some((t) => t.name === "searchMovies" || t.name === "searchByVibe")).toBe(true);
  });

  it("plans marathon builder", () => {
    const tools = planAgentTools("Build a weekend marathon for me");
    expect(tools[0]?.name).toBe("buildMarathon");
  });

  it("plans taste tools for profile questions", () => {
    const tools = planAgentTools("What does my taste DNA look like?");
    expect(tools.some((t) => t.name === "getTasteDNA")).toBe(true);
  });

  it("plans scene memory search", () => {
    const tools = planAgentTools("I remember a movie with a blue hallway chase");
    expect(tools.some((t) => t.name === "searchSemanticCatalog")).toBe(true);
  });
});
