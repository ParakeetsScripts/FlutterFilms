import { afterEach, describe, expect, it } from "vitest";
import { getCanonicalSiteLabel, getCanonicalSiteUrl } from "./site-url";

describe("canonical site URL", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("uses NEXT_PUBLIC_SITE_URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flutter-films.vercel.app";
    expect(getCanonicalSiteUrl()).toBe("https://flutter-films.vercel.app");
    expect(getCanonicalSiteLabel()).toBe("flutter-films.vercel.app");
  });

  it("does not hardcode flutterfilms.app", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://flutter-films.vercel.app";
    expect(getCanonicalSiteLabel()).not.toBe("flutterfilms.app");
  });
});
