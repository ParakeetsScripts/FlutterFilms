import { describe, expect, it } from "vitest";
import type { AnalyticsEventName } from "./events";

describe("analytics events", () => {
  it("includes core product events", () => {
    const names: AnalyticsEventName[] = [
      "page_view",
      "movie_viewed",
      "watchlist_added",
      "tonight_picker_completed",
      "onboarding_completed",
      "pwa_installed",
    ];
    expect(names).toHaveLength(6);
  });
});
