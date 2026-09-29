import { describe, expect, it } from "vitest";
import { computeTotalChunks } from "./ingest";

describe("media ingest", () => {
  it("computes chunk counts", () => {
    expect(computeTotalChunks(1, 5)).toBe(1);
    expect(computeTotalChunks(5 * 1024 * 1024, 5 * 1024 * 1024)).toBe(1);
    expect(computeTotalChunks(5 * 1024 * 1024 + 1, 5 * 1024 * 1024)).toBe(2);
  });
});
