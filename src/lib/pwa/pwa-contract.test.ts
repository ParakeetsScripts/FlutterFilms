import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { SITE_NAME } from "@/lib/brand";
import { getInstallCapability } from "./platform";

describe("PWA contract", () => {
  it("manifest uses FlutterFilms branding and valid start URL", () => {
    const data = manifest();
    expect(data.name).toBe(SITE_NAME);
    expect(data.short_name).toBe(SITE_NAME);
    expect(data.start_url).toBe("/");
    expect(data.scope).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.icons?.length).toBeGreaterThan(2);
  });

  it("referenced icon files exist", () => {
    const root = process.cwd();
    for (const icon of manifest().icons ?? []) {
      const path = join(root, "public", icon.src.replace(/^\//, ""));
      expect(readFileSync(path).byteLength).toBeGreaterThan(100);
    }
    expect(readFileSync(join(root, "public/favicon.png")).byteLength).toBeGreaterThan(100);
  });

  it("service worker avoids caching private API routes", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(sw).toContain("/api/");
    expect(sw).toContain("isPrivateRequest");
    expect(sw).toContain("flutter-films-shell-v2");
  });

  it("install capability never claims native store distribution", () => {
    const capability = getInstallCapability(false);
    expect(capability.summary).not.toMatch(/app store|google play|apk|ipa/i);
  });
});
