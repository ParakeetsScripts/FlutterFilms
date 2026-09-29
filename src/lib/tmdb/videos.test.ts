import { describe, expect, it } from "vitest";
import { getPrimaryHeroVideo, getPrimaryTrailer, prioritizeVideos } from "./videos";

const videos = [
  { id: "1", name: "Featurette", key: "f", site: "YouTube", type: "Featurette", official: true, publishedAt: null },
  { id: "2", name: "Trailer", key: "t", site: "YouTube", type: "Trailer", official: true, publishedAt: null },
];

describe("videos", () => {
  it("prioritizes official trailers", () => {
    expect(prioritizeVideos(videos)[0]?.type).toBe("Trailer");
    expect(getPrimaryTrailer(videos)?.key).toBe("t");
  });

  it("prefers clips for hero backgrounds", () => {
    const withClip = [
      ...videos,
      { id: "4", name: "Clip", key: "clip", site: "YouTube", type: "Clip", official: true, publishedAt: null },
    ];
    expect(getPrimaryHeroVideo(withClip)?.key).toBe("clip");
    expect(getPrimaryTrailer(withClip)?.key).toBe("t");
  });

  it("falls back to teasers when no trailer exists", () => {
    const teaserOnly = [
      { id: "3", name: "Teaser", key: "teaser", site: "YouTube", type: "Teaser", official: true, publishedAt: null },
      { id: "1", name: "Featurette", key: "f", site: "YouTube", type: "Featurette", official: true, publishedAt: null },
    ];
    expect(getPrimaryTrailer(teaserOnly)?.key).toBe("teaser");
  });
});
