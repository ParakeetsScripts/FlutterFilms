import { trustBadge } from "../trust";

export type CreativeKind =
  | "poster"
  | "watchlist_poster"
  | "movie_night_card"
  | "franchise_timeline"
  | "comparison"
  | "trailer_concept"
  | "review_outline";

export function buildCreativeAsset(
  kind: CreativeKind,
  input: {
    title: string;
    subtitle?: string;
    items?: Array<{ label: string; value: string }>;
    movies?: Array<{ title: string; year?: number | null }>;
  },
) {
  const width = 800;
  const height = kind === "movie_night_card" ? 450 : 1200;
  const accent = "#4a9eff";
  const bg = "#0a0a0c";

  const lines = (input.items ?? []).slice(0, 6);
  const movieLines = (input.movies ?? [])
    .slice(0, 8)
    .map((m, i) => `<text x="48" y="${180 + i * 36}" fill="#c8d0dc" font-size="18" font-family="system-ui">${i + 1}. ${escapeXml(m.title)}${m.year ? ` (${m.year})` : ""}</text>`)
    .join("");

  const detailLines = lines
    .map((item, i) => `<text x="48" y="${220 + i * 32}" fill="#9aa8b8" font-size="16" font-family="system-ui">${escapeXml(item.label)}: ${escapeXml(item.value)}</text>`)
    .join("");

  const label =
    kind === "poster"
      ? "Poster concept card (deterministic SVG — not a generative image model)"
      : kind === "watchlist_poster"
        ? "Watchlist concept card (SVG template)"
        : kind === "movie_night_card"
          ? "Movie night concept card (SVG template)"
          : "Concept graphic (SVG template)";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="16" fill="none" stroke="${accent}" stroke-opacity="0.35"/>
  <text x="48" y="72" fill="${accent}" font-size="14" font-family="system-ui" letter-spacing="2">FLUTTERFILMS · ${escapeXml(label.toUpperCase())}</text>
  <text x="48" y="130" fill="#f0f4f8" font-size="42" font-weight="600" font-family="Georgia, serif">${escapeXml(input.title)}</text>
  ${input.subtitle ? `<text x="48" y="168" fill="#8b98a8" font-size="20" font-family="system-ui">${escapeXml(input.subtitle)}</text>` : ""}
  ${movieLines}
  ${detailLines}
</svg>`;

  let textContent = "";
  if (kind === "trailer_concept") {
    textContent = [
      `TRAILER CONCEPT — ${input.title}`,
      "Not an official studio trailer.",
      "",
      "ACT 1: Establish world and protagonist desire.",
      "ACT 2: Escalation using verified catalog tone — no invented plot facts.",
      "ACT 3: Emotional button tied to themes from metadata.",
    ].join("\n");
  } else if (kind === "review_outline") {
    textContent = [
      `Review outline — ${input.title}`,
      "1. First impression (your opinion)",
      "2. Performances (cite cast from catalog)",
      "3. Craft — cinematography, sound, pacing (your take)",
      "4. Themes (label interpretation vs verified facts)",
      "5. Who should watch / rewatch value",
    ].join("\n");
  }

  return {
    kind,
    svg,
    textContent,
    disclaimer: label,
    labels: [trustBadge("ai_interpretation")],
  };
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
