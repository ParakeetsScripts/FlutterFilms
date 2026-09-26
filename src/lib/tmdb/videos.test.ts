import { describe, expect, it } from "vitest";
import { getPrimaryTrailer, prioritizeVideos } from "./videos";

const videos = [
  { id: "1", name: "Featurette", key: "f", site: "YouTube", type: "Featurette", official: true, publishedAt: null },
  { id: "2", name: "Trailer", key: "t", site: "YouTube", type: "Trailer", official: true, publishedAt: null },
];

describe("videos", () => {
  it("prioritizes official trailers", () => {
    expect(prioritizeVideos(videos)[0]?.type).toBe("Trailer");
    expect(getPrimaryTrailer(videos)?.key).toBe("t");
  });
});
