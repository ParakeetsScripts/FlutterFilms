import "server-only";

import { computeTasteDna } from "./taste";
import { runRecommendation } from "./recommendations";
import { trustBadge } from "../trust";

export type TasteProfile = {
  label: string;
  movieIds: number[];
};

export async function tasteIntersection(profiles: TasteProfile[]) {
  const dnas = await Promise.all(profiles.map((p) => computeTasteDna(p.movieIds)));
  const genreSets = dnas.map((d) => new Set(d.genres.map((g) => g.name)));
  const shared = [...genreSets[0] ?? []].filter((g) => genreSets.every((s) => s.has(g)));

  const decadeOverlap = new Map<number, number>();
  for (const dna of dnas) {
    for (const { decade, count } of dna.decades) {
      decadeOverlap.set(decade, (decadeOverlap.get(decade) ?? 0) + count);
    }
  }

  return {
    sharedGenres: shared,
    decadeOverlap: [...decadeOverlap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([decade, score]) => ({ decade, score })),
    labels: [trustBadge("user"), trustBadge("metadata")],
  };
}

export async function tasteMatchPercent(a: TasteProfile, b: TasteProfile) {
  const [dnaA, dnaB] = await Promise.all([computeTasteDna(a.movieIds), computeTasteDna(b.movieIds)]);
  const genresA = new Set(dnaA.genres.map((g) => g.name));
  const genresB = new Set(dnaB.genres.map((g) => g.name));
  const union = new Set([...genresA, ...genresB]);
  const intersection = [...genresA].filter((g) => genresB.has(g));
  const percent = union.size ? Math.round((intersection.length / union.size) * 100) : 0;

  return {
    percent,
    sharedGenres: intersection,
    explanation: `Genre overlap from ${a.label} and ${b.label} libraries — similarity, not a ranking.`,
    labels: [trustBadge("user"), trustBadge("ai_prediction")],
  };
}

export async function groupPick(profiles: TasteProfile[], history: number[] = []) {
  const mergedIds = [...new Set([...profiles.flatMap((p) => p.movieIds), ...history])];
  const intersection = await tasteIntersection(profiles);
  const rec = await runRecommendation({
    mode: "group",
    watchlist: mergedIds,
    favorites: mergedIds.slice(0, 10),
    history,
    groupTasteIds: profiles.map((p) => p.movieIds),
  });

  const overlaps = intersection.sharedGenres.length
    ? `Shared taste: ${intersection.sharedGenres.join(", ")}.`
    : "No strong genre overlap — pick balances diverse preferences.";

  const compromises =
    profiles.length > 1 && !intersection.sharedGenres.length
      ? "Compromise: chosen from highly-rated catalog titles acceptable to mixed tastes."
      : "Minimal compromise needed based on overlapping preferences.";

  return {
    pick: rec.primary,
    alternates: rec.movies.slice(1, 3),
    sharedGenres: intersection.sharedGenres,
    overlaps,
    compromises,
    reason: `Group pick for ${profiles.map((p) => p.label).join(", ")}. ${overlaps}`,
    labels: [...rec.labels, trustBadge("ai_prediction")],
  };
}
