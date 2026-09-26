import { describe, expect, it } from "vitest";
import { getBackdropUrl, getPosterUrl, getProfileUrl } from "./images";

describe("image urls", () => {
  it("builds poster, backdrop, and profile urls", () => {
    expect(getPosterUrl("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
    expect(getBackdropUrl("/bg.jpg")).toBe("https://image.tmdb.org/t/p/w1280/bg.jpg");
    expect(getProfileUrl("/face.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/face.jpg");
  });

  it("returns null when the path is missing", () => {
    expect(getPosterUrl(null)).toBeNull();
    expect(getBackdropUrl("")).toBeNull();
  });
});
