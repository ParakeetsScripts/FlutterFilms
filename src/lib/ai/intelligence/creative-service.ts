import "server-only";

import { completeWithConnectedModel } from "../complete";
import { buildCreativeAsset, type CreativeKind } from "./creative";
import { getMovieRow } from "@/lib/sync/repository";

export type CreativeGenerationInput = {
  kind: CreativeKind;
  title: string;
  subtitle?: string;
  watchlistIds?: number[];
  movieId?: number;
};

async function resolveWatchlistMovies(ids: number[]) {
  const movies: Array<{ title: string; year?: number | null }> = [];
  for (const id of ids.slice(0, 12)) {
    const row = await getMovieRow(id);
    if (row) movies.push({ title: row.title, year: row.year });
    else movies.push({ title: `Movie #${id}` });
  }
  return movies;
}

async function maybeGenerateText(kind: CreativeKind, title: string, subtitle?: string, context?: string) {
  if (kind !== "trailer_concept" && kind !== "review_outline") return null;

  const system =
    kind === "trailer_concept"
      ? "You write fan trailer concepts for movies. Use only the title/context given. Label speculation clearly. Do not invent cast or plot facts."
      : "You write personal movie review outlines. Use structured sections. Distinguish verified facts from opinion.";

  const user = [
    `Title: ${title}`,
    subtitle ? `Context: ${subtitle}` : null,
    context ? `Extra: ${context}` : null,
    kind === "trailer_concept"
      ? "Write a 3-act trailer concept (fan speculation only)."
      : "Write a 5-section review outline.",
  ]
    .filter(Boolean)
    .join("\n");

  return completeWithConnectedModel(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { preferCoding: false },
  );
}

async function maybeGenerateItems(kind: CreativeKind, title: string, subtitle?: string) {
  if (kind !== "franchise_timeline" && kind !== "comparison") return undefined;

  const prompt =
    kind === "franchise_timeline"
      ? `List 4-6 chronological franchise beats for "${title}". Format each line as "Label | value". Fan ordering only — no invented release dates unless in context.`
      : `Compare "${title}"${subtitle ? ` vs ${subtitle}` : ""}. Give 4 comparison dimensions as "Label | value" lines.`;

  const text = await completeWithConnectedModel(
    [
      {
        role: "system",
        content: "Reply with plain lines only, each formatted as Label | value. No markdown.",
      },
      { role: "user", content: prompt },
    ],
    { preferCoding: false },
  );

  if (!text) return undefined;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), value: rest.join("|").trim() || "—" };
    });
}

export async function runCreativeGeneration(input: CreativeGenerationInput) {
  const movies =
    input.kind === "watchlist_poster" || input.kind === "movie_night_card"
      ? await resolveWatchlistMovies(input.watchlistIds ?? [])
      : undefined;

  let movieContext: string | undefined;
  if (input.movieId) {
    const row = await getMovieRow(input.movieId);
    if (row) movieContext = `${row.title}${row.year ? ` (${row.year})` : ""}`;
  }

  const items = await maybeGenerateItems(input.kind, input.title, input.subtitle);
  const asset = buildCreativeAsset(input.kind, {
    title: input.title,
    subtitle: input.subtitle,
    movies,
    items,
  });

  const llmText = await maybeGenerateText(
    input.kind,
    input.title,
    input.subtitle,
    movieContext ?? movies?.map((m) => m.title).join(", "),
  );
  if (llmText) asset.textContent = llmText;

  return asset;
}
