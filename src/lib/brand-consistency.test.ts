import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_FULL_NAME, SITE_NAME } from "./brand";
import manifest from "../app/manifest";

const FORBIDDEN_PUBLIC = [
  "Flutter Films",
  "VitaMovies",
  "Vitamovies",
  "flutterfilms.app",
];

const BRAND_CREDIT_FILES = new Set([
  join(process.cwd(), "src/lib/brand.ts"),
  join(process.cwd(), "src/components/layout/Logo.tsx"),
  join(process.cwd(), "src/components/layout/AppShell.tsx"),
]);

const SCAN_DIRS = ["src/app", "src/components"];

function collectFiles(dir: string): string[] {
  const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");
  const root = join(process.cwd(), dir);
  const entries = readdirSync(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(join(dir, entry.name)));
    else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.includes(".test.")) files.push(path);
  }
  return files;
}

describe("public brand consistency", () => {
  it("uses FlutterFilms as the product name", () => {
    expect(SITE_NAME).toBe("FlutterFilms");
    expect(SITE_FULL_NAME).toBe("FlutterFilms");
  });

  it("manifest uses FlutterFilms", () => {
    const data = manifest();
    expect(data.name).toBe("FlutterFilms");
    expect(data.short_name).toBe("FlutterFilms");
    expect(data.name).not.toContain("by Ritvik");
  });

  it("public UI source avoids forbidden brand strings", () => {
    const violations: string[] = [];
    for (const file of SCAN_DIRS.flatMap(collectFiles)) {
      if (file.includes("/admin/")) continue;
      const text = readFileSync(file, "utf8");
      for (const forbidden of FORBIDDEN_PUBLIC) {
        if (text.includes(forbidden)) {
          violations.push(`${file}: ${forbidden}`);
        }
      }
      if (!BRAND_CREDIT_FILES.has(file)) {
        for (const credit of ["FlutterFilms by Ritvik M", "FlutterFilms by Ritvik", "by Ritvik M"]) {
          if (text.includes(credit)) violations.push(`${file}: ${credit}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
