import { describe, expect, it } from "vitest";
import { getTasteAnchorId } from "./personalization";

describe("getTasteAnchorId", () => {
  it("returns null when personalization disabled", () => {
    expect(
      getTasteAnchorId({
        favorites: [1],
        continueWatching: [],
        disablePersonalizedRows: true,
      }),
    ).toBeNull();
  });

  it("returns null for browse-only history without favorites or playback", () => {
    expect(
      getTasteAnchorId({
        favorites: [],
        continueWatching: [],
      }),
    ).toBeNull();
  });

  it("uses favorite as anchor", () => {
    expect(
      getTasteAnchorId({
        favorites: [42, 7],
        continueWatching: [{ movieId: 99, positionSeconds: 120 }],
      }),
    ).toBe(42);
  });

  it("uses playback when no favorites", () => {
    expect(
      getTasteAnchorId({
        favorites: [],
        continueWatching: [{ movieId: 99, positionSeconds: 120 }],
      }),
    ).toBe(99);
  });

  it("ignores trivial playback under 60 seconds", () => {
    expect(
      getTasteAnchorId({
        favorites: [],
        continueWatching: [{ movieId: 99, positionSeconds: 30 }],
      }),
    ).toBeNull();
  });
});
