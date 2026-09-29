import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  tmdbFetch: vi.fn(async (_path: string, params: Record<string, unknown>) => {
    return {
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [],
      _params: params,
    };
  }),
}));

import { discoverMovies } from "./discover";
import { tmdbFetch } from "./client";

describe("discoverMovies", () => {
  it("uses ascending order for title sort", async () => {
    await discoverMovies({ sort: "title", page: 1, uiLanguage: "en" });
    expect(tmdbFetch).toHaveBeenCalled();
    const [, params] = (tmdbFetch as ReturnType<typeof vi.fn>).mock.calls.at(-1) ?? [];
    expect(params.sort_by).toBe("original_title.asc");
  });

  it("uses descending order for rating sort", async () => {
    await discoverMovies({ sort: "rating", page: 1, uiLanguage: "en" });
    const [, params] = (tmdbFetch as ReturnType<typeof vi.fn>).mock.calls.at(-1) ?? [];
    expect(params.sort_by).toBe("vote_average.desc");
  });
});
