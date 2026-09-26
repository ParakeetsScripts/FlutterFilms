import { describe, expect, it } from "vitest";
import { watchLabel } from "./labels";

describe("playback labels", () => {
  it("never uses Watch now unless playback is actually available", () => {
    expect(watchLabel("PLAYABLE")).toBe("Watch now");
    expect(watchLabel("AVAILABLE_EXTERNALLY")).toBe("Where to watch");
    expect(watchLabel("TRAILER_ONLY")).toBe("Watch trailer");
    expect(watchLabel("NO_PLAYBACK_SOURCE")).toBe("Add to watchlist");
  });
});
