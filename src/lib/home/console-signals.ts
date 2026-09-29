import type { ParsedVibeQuery } from "@/lib/ai/intelligence/vibe-query";
import { genreName } from "@/lib/tmdb/genres";

export type ConsoleSignalKind = "pick" | "reference" | "genre" | "twist" | "runtime" | "rating" | "explore";

export type ConsoleSignal = { kind: ConsoleSignalKind; label: string };

const MAX_SIGNALS = 6;

export function formatRuntimeLimit(minutes: number): string {
  if (minutes < 60) return `≤ ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `≤ ${hours}h ${rest}m` : `≤ ${hours}h`;
}

/**
 * Visual preview of how the vibe-search backend will read a query. Every signal comes
 * from `parseVibeQuery` — the same parser the API uses — so nothing here is inferred.
 */
export function signalsFromParsedQuery(parsed: ParsedVibeQuery): ConsoleSignal[] {
  const signals: ConsoleSignal[] = [];

  if (parsed.singlePick) signals.push({ kind: "pick", label: "One pick" });
  if (parsed.mode === "reference_twist" && parsed.referenceTitle) {
    signals.push({ kind: "reference", label: `Like ${parsed.referenceTitle}` });
  }
  for (const id of parsed.filterGenres) {
    const name = genreName(id);
    if (name) signals.push({ kind: "genre", label: name });
  }
  for (const id of parsed.twistGenres) {
    const name = genreName(id);
    if (name) signals.push({ kind: "twist", label: `+ ${name}` });
  }
  if (parsed.runtimeLte) signals.push({ kind: "runtime", label: formatRuntimeLimit(parsed.runtimeLte) });
  if (parsed.ratingGte) signals.push({ kind: "rating", label: `TMDB ${parsed.ratingGte}+` });
  if (parsed.mode === "explore_outside") signals.push({ kind: "explore", label: "Outside your usual" });

  const seen = new Set<string>();
  return signals
    .filter((signal) => {
      if (seen.has(signal.label)) return false;
      seen.add(signal.label);
      return true;
    })
    .slice(0, MAX_SIGNALS);
}
