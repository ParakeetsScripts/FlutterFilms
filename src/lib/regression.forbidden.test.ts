import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (entry === "node_modules" || entry === ".next") return [];
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(join(process.cwd(), "src")).filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes(".test."));
const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

describe("forbidden behavior", () => {
  it("does not scrape TMDB HTML", () => {
    expect(source).not.toMatch(/cheerio|jsdom|parseHTML\(/);
    expect(source).not.toMatch(/fetch\(["'`]https:\/\/www\.themoviedb\.org/);
  });

  it("does not scrape Einthusan or invent stream capture", () => {
    expect(source).not.toMatch(/einthusan\.tv\/movie/i);
    expect(source).not.toMatch(/bypass DRM/i);
    expect(source.includes("enabled: false")).toBe(true);
  });

  it("keeps TMDB credentials on the server", () => {
    const clientFiles = files.filter((file) => {
      const text = readFileSync(file, "utf8");
      return text.includes('"use client"');
    });
    for (const file of clientFiles) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(/TMDB_API_TOKEN|TMDB_API_KEY/);
    }
  });

  it("keeps catalog and playback resolution off the client bundle", () => {
    const clientFiles = files.filter((file) => readFileSync(file, "utf8").includes('"use client"'));
    for (const file of clientFiles) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(/@\/lib\/playback\/resolver/);
      expect(text).not.toMatch(/@\/lib\/tmdb\/movies/);
      expect(text).not.toMatch(/@\/lib\/sync\/catalog/);
    }
  });
});
