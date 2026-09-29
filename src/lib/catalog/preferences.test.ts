import { describe, expect, it } from "vitest";
import { catalogFromSettings } from "./preferences";

describe("catalogFromSettings", () => {
  it("filters to Tamil when catalog language is ta", () => {
    const prefs = catalogFromSettings({ language: "ta", region: "IN", preferredLanguages: [] });
    expect(prefs.uiLanguage).toBe("ta");
    expect(prefs.originalLanguage).toBe("ta");
    expect(prefs.region).toBe("IN");
  });

  it("uses first preferred language when catalog is English", () => {
    const prefs = catalogFromSettings({ language: "en", preferredLanguages: ["hi", "ta"], region: "US" });
    expect(prefs.originalLanguage).toBe("hi");
  });
});
