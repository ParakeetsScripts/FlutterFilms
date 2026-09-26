import { describe, expect, it } from "vitest";
import { classifyFreshness, formatRelativeTime } from "./freshness";
import { hashValue } from "./hash";
import { FIELD_PRIORITY } from "./field-priority";

describe("sync engine helpers", () => {
  it("hashes normalized values deterministically", () => {
    const a = hashValue({ title: "Sweeney Todd", voteAverage: 7.2 });
    const b = hashValue({ title: "Sweeney Todd", voteAverage: 7.2 });
    const c = hashValue({ title: "Sweeney Todd", voteAverage: 7.3 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("classifies TMDB freshness within expected windows", () => {
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(classifyFreshness(recent, "tmdb")).toBe("FRESH");
  });

  it("classifies IMDb daily cadence separately", () => {
    const yesterday = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    expect(classifyFreshness(yesterday, "imdb")).toBe("FRESH");
  });

  it("formats relative timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5 min ago");
  });

  it("documents runtime field priority", () => {
    expect(FIELD_PRIORITY.runtime.primary).toBe("imdb");
    expect(FIELD_PRIORITY.runtime.fallback).toBe("tmdb");
  });
});
