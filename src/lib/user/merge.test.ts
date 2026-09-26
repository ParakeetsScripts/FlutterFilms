import { describe, expect, it } from "vitest";
import { mergeLibraries } from "./merge";

describe("mergeLibraries", () => {
  const server = {
    watchlist: [1],
    favorites: [2],
    history: [{ movieId: 3, viewedAt: "2026-01-02" }],
    continueWatching: [],
    settings: { theme: "noir" },
  };

  it("merges without overwriting newer history", () => {
    const merged = mergeLibraries(
      server,
      {
        watchlist: [4],
        history: [{ movieId: 3, viewedAt: "2026-01-01" }, { movieId: 5, viewedAt: "2026-01-03" }],
      },
      "all",
    );
    expect(merged.watchlist).toContain(4);
    expect(merged.history.find((h) => h.movieId === 3)?.viewedAt).toBe("2026-01-02");
    expect(merged.history.find((h) => h.movieId === 5)?.viewedAt).toBe("2026-01-03");
  });

  it("skips device data when mode is skip", () => {
    const merged = mergeLibraries(server, { watchlist: [99] }, "skip");
    expect(merged.watchlist).toEqual([1]);
  });
});
