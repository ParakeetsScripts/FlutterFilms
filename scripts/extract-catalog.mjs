import fs from "node:fs";

const src = fs.readFileSync("src/lib/ai/features/registry.ts", "utf8");
const m = src.match(/export const INTELLIGENCE_FEATURES[^=]+=\s*(\[[\s\S]*?\]);/);
if (!m) throw new Error("catalog array not found");

const head = `export type FeatureCategory =
  | "discovery"
  | "movie"
  | "people"
  | "franchise"
  | "personal"
  | "social"
  | "watching"
  | "search"
  | "creative"
  | "agent";

export type FeatureCatalogEntry = {
  id: number;
  slug: string;
  title: string;
  category: FeatureCategory;
  description: string;
  href?: string;
  api?: string;
};

export const FEATURE_CATALOG: FeatureCatalogEntry[] = `;

fs.writeFileSync("src/lib/ai/features/catalog.ts", `${head}${m[1]};\n`);
