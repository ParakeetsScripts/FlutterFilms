import fs from "node:fs";
import { FEATURE_CATALOG } from "../src/lib/ai/features/catalog.ts";
import { getFeatureDefinitions } from "../src/lib/ai/features/definitions.ts";
import { getValidatedFeatures, countByStatus } from "../src/lib/ai/features/validate.ts";

const validated = getValidatedFeatures();
const counts = countByStatus();

const lines = [
  "# Feature Acceptance Matrix",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `| Status | Count |`,
  `|--------|------:|`,
  `| LIVE | ${counts.live} |`,
  `| BETA | ${counts.beta} |`,
  `| PLANNED | ${counts.planned} |`,
  `| DEGRADED | ${counts.degraded} |`,
  `| ERROR | ${counts.error} |`,
  "",
  "## Matrix",
  "",
  "| Feature ID | Slug | Status | Backend | DB | API | UI | Tests | Data | AI | Route | Notes |",
  "|-----------:|------|--------|---------|----|----|----|-------|------|----|-------|-------|",
];

for (const f of validated) {
  const def = getFeatureDefinitions().find((d) => d.slug === f.slug);
  const notes = f.blockers.slice(0, 2).join("; ") || "Validated";
  lines.push(
    `| ${f.id} | ${f.slug} | ${f.status} | ${f.hasService ? "yes" : "no"} | ${def.requiredData.includes("user") ? "user" : "catalog"} | ${f.hasApi ? "yes" : "no"} | ${f.hasUi ? "yes" : "no"} | ${f.hasTests ? "yes" : "no"} | ${def.requiredData.join("+")} | ${def.requiredModelCapabilities.length ? def.requiredModelCapabilities.join(",") : "none"} | ${f.route} | ${notes} |`,
  );
}

fs.writeFileSync("docs/FEATURE_ACCEPTANCE_MATRIX.md", `${lines.join("\n")}\n`);
console.log(`Wrote docs/FEATURE_ACCEPTANCE_MATRIX.md (${FEATURE_CATALOG.length} features)`);
console.log(counts);
