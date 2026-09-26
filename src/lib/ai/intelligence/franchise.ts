import "server-only";

import { getMovieCollection } from "@/lib/tmdb/movies";
import { normalizeMovieSummary } from "@/lib/tmdb/normalize";
import { trustBadge } from "../trust";

export async function analyzeFranchise(collectionId: number, watchedIds: number[] = []) {
  const collection = await getMovieCollection(collectionId);
  const movies = collection.parts
    .map((p) => normalizeMovieSummary(p))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));

  const ratings = movies.map((m) => m.voteAverage).filter((v): v is number => v != null);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const watched = movies.filter((m) => watchedIds.includes(m.id));
  const unwatched = movies.filter((m) => !watchedIds.includes(m.id));

  const ratingTrend = movies.map((m) => ({
    id: m.id,
    title: m.title,
    year: m.year,
    rating: m.voteAverage,
  }));

  const gaps: string[] = [];
  for (let i = 1; i < movies.length; i++) {
    const prev = movies[i - 1];
    const curr = movies[i];
    if (prev.year && curr.year && curr.year - prev.year > 8) {
      gaps.push(`${prev.title} → ${curr.title}: ${curr.year - prev.year}-year gap between releases.`);
    }
  }

  return {
    id: collection.id,
    name: collection.name,
    movieCount: movies.length,
    avgTmdbRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    chronological: movies,
    releaseOrder: [...movies].sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "")),
    watchOrderNote:
      "Release order matches TMDB collection sort. Chronological in-universe order may differ — verify per franchise.",
    watchedCount: watched.length,
    completionPercent: movies.length ? Math.round((watched.length / movies.length) * 100) : 0,
    unwatched,
    entryRecommendation: unwatched[0] ?? movies[0] ?? null,
    health: {
      ratingTrend,
      gaps,
      lowestRated: [...movies].sort((a, b) => (a.voteAverage ?? 0) - (b.voteAverage ?? 0))[0] ?? null,
      highestRated: [...movies].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))[0] ?? null,
    },
    timelineConflicts: detectTimelineConflicts(movies),
    labels: [trustBadge("metadata")],
  };
}

function detectTimelineConflicts(
  movies: Array<{ id: number; title: string; year?: number | null; releaseDate?: string | null }>,
) {
  const conflicts: Array<{ type: string; detail: string; verified: boolean }> = [];
  for (let i = 1; i < movies.length; i++) {
    const prev = movies[i - 1];
    const curr = movies[i];
    if (prev.year && curr.year && curr.year < prev.year) {
      conflicts.push({
        type: "release_order",
        detail: `${curr.title} (${curr.year}) is listed after ${prev.title} (${prev.year}) but released earlier.`,
        verified: true,
      });
    }
  }
  return conflicts;
}

export async function compareFranchises(collectionIdA: number, collectionIdB: number) {
  const [a, b] = await Promise.all([analyzeFranchise(collectionIdA), analyzeFranchise(collectionIdB)]);
  const genresA = new Set(a.chronological.flatMap((m) => m.genres?.map((g) => g.name) ?? []));
  const genresB = new Set(b.chronological.flatMap((m) => m.genres?.map((g) => g.name) ?? []));
  const shared = [...genresA].filter((g) => genresB.has(g));
  const score = genresA.size + genresB.size ? Math.round((shared.length / (genresA.size + genresB.size - shared.length)) * 100) : 0;
  return {
    franchiseA: a.name,
    franchiseB: b.name,
    similarityPercent: score,
    sharedGenres: shared,
    labels: [trustBadge("metadata"), trustBadge("ai_interpretation")],
    note: "Similarity from shared genre metadata — not a quality judgment.",
  };
}

export async function findSpinOffs(collectionId: number) {
  const analysis = await analyzeFranchise(collectionId);
  const keywords = analysis.name.split(/\s+/).filter((w) => w.length > 3);
  return {
    collectionId,
    name: analysis.name,
    relatedInCollection: analysis.chronological,
    searchHints: keywords,
    labels: [trustBadge("metadata")],
    disclaimer: "Spin-offs require verified collection links — search hints only unless TMDB links exist.",
  };
}
