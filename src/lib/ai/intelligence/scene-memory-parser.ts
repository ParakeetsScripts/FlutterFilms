export type SceneClue = {
  label: string;
  value: string;
  source: "user" | "inferred";
};

const SETTING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /snow|blizzard|winter|frozen/i, label: "snow/winter setting" },
  { pattern: /building|hotel|tower|apartment/i, label: "interior building" },
  { pattern: /hallway|corridor|stairs/i, label: "hallway/chase" },
  { pattern: /space|spaceship|planet|alien/i, label: "sci-fi setting" },
  { pattern: /ocean|ship|boat|island/i, label: "water/island setting" },
  { pattern: /forest|woods|jungle/i, label: "forest setting" },
];

function extractYearHint(text: string): number | null {
  const four = text.match(/\b(19|20)\d{2}\b/);
  if (four) return Number(four[0]);
  const decade = text.match(/\b(80s|90s|2000s|2010s|2020s)\b/i);
  if (decade) {
    const map: Record<string, number> = { "80s": 1985, "90s": 1995, "2000s": 2005, "2010s": 2015, "2020s": 2022 };
    return map[decade[0].toLowerCase()] ?? null;
  }
  return null;
}

export function parseSceneDescription(parts: string[]) {
  const text = parts.filter(Boolean).join(" ");
  const clues: SceneClue[] = parts
    .filter(Boolean)
    .map((p, i) => ({ label: `Clue ${i + 1}`, value: p.trim(), source: "user" as const }));

  for (const { pattern, label } of SETTING_PATTERNS) {
    if (pattern.test(text)) clues.push({ label: "Inferred setting", value: label, source: "inferred" });
  }

  const year = extractYearHint(text);
  if (year) clues.push({ label: "Era hint", value: String(year), source: "inferred" });

  const missing: string[] = [];
  if (!year) missing.push("Release year or decade");
  if (!SETTING_PATTERNS.some((s) => s.pattern.test(text))) missing.push("Specific setting or visual detail");
  if (parts.filter(Boolean).length < 2) missing.push("Additional plot or character clues");

  return { text, clues, yearHint: year, missing };
}
