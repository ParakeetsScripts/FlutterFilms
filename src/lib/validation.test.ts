import { describe, expect, it } from "vitest";
import { parseMovieId, parsePage, parseQuery, parseRegion, parseYear } from "./validation";

describe("validation", () => {
  it("parses slugged movie ids", () => {
    expect(parseMovieId("13885-sweeney-todd-the-demon-barber-of-fleet-street")).toBe(13885);
  });

  it("rejects invalid values", () => {
    expect(() => parseMovieId("sweeney")).toThrow();
    expect(() => parsePage("0")).toThrow();
    expect(() => parseYear("1200")).toThrow();
    expect(() => parseRegion("usa")).toThrow();
    expect(() => parseQuery("")).toThrow();
  });
});
