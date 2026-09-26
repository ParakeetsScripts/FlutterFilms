import "server-only";

import { getMovie } from "@/lib/tmdb/movies";
import { getGenreList } from "@/lib/tmdb/configuration";
import type { Movie } from "@/lib/tmdb/types";
import { listTasteSnapshots } from "@/lib/user/taste-repository";
import { trustBadge } from "../trust";

export type TasteDna = {
  movieCount: number;
  genres: Array<{ name: string; count: number; percent: number }>;
  decades: Array<{ decade: number; count: number }>;
  countries: Array<{ name: string; count: number }>;
  languages: Array<{ code: string; count: number }>;
  avgRuntime: number | null;
  avgTmdb: number | null;
  avgImdb: number | null;
  unexploredGenres: string[];
  labels: ReturnType<typeof trustBadge>[];
};

export async function computeTasteDna(movieIds: number[]): Promise<TasteDna> {
  const unique = [...new Set(movieIds)].slice(0, 80);
  const movies = (
    await Promise.all(unique.map((id) => getMovie(id).catch(() => null)))
  ).filter((m): m is Movie => Boolean(m));

  const genreCounts = new Map<string, number>();
  const decadeCounts = new Map<number, number>();
  const countryCounts = new Map<string, number>();
  const langCounts = new Map<string, number>();
  let runtimeSum = 0;
  let runtimeN = 0;
  let tmdbSum = 0;
  let tmdbN = 0;
  let imdbSum = 0;
  let imdbN = 0;

  for (const movie of movies) {
    for (const g of movie.genres) genreCounts.set(g.name, (genreCounts.get(g.name) ?? 0) + 1);
    if (movie.year) {
      const decade = Math.floor(movie.year / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
    }
    for (const c of movie.productionCountries) countryCounts.set(c.name, (countryCounts.get(c.name) ?? 0) + 1);
    if (movie.originalLanguage) langCounts.set(movie.originalLanguage, (langCounts.get(movie.originalLanguage) ?? 0) + 1);
    if (movie.runtime) {
      runtimeSum += movie.runtime;
      runtimeN += 1;
    }
    if (movie.voteAverage != null) {
      tmdbSum += movie.voteAverage;
      tmdbN += 1;
    }
    if (movie.imdbRating != null) {
      imdbSum += movie.imdbRating;
      imdbN += 1;
    }
  }

  const totalGenre = [...genreCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const genres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, percent: Math.round((count / totalGenre) * 100) }));

  let allGenreNames: string[] = [];
  try {
    const genreList = await getGenreList();
    allGenreNames = genreList.genres.map((g) => g.name);
  } catch {
    allGenreNames = [];
  }
  const unexploredGenres = allGenreNames.filter((g) => !genreCounts.has(g));

  return {
    movieCount: movies.length,
    genres,
    decades: [...decadeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([decade, count]) => ({ decade, count })),
    countries: [...countryCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    languages: [...langCounts.entries()].sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count })),
    avgRuntime: runtimeN ? Math.round(runtimeSum / runtimeN) : null,
    avgTmdb: tmdbN ? Math.round((tmdbSum / tmdbN) * 10) / 10 : null,
    avgImdb: imdbN ? Math.round((imdbSum / imdbN) * 10) / 10 : null,
    unexploredGenres,
    labels: [trustBadge("metadata"), trustBadge("user")],
  };
}

export function buildPersonalityCard(dna: TasteDna) {
  const topGenre = dna.genres[0]?.name ?? "Eclectic";
  const topDecade = dna.decades[0]?.decade ?? 2000;
  return {
    archetype: `${topGenre} explorer`,
    headline: `${dna.movieCount} films · avg ${dna.avgTmdb ?? "—"} TMDB`,
    topGenre,
    topDecade,
    unexplored: dna.unexploredGenres.slice(0, 3),
    labels: [trustBadge("user"), trustBadge("ai_interpretation")],
  };
}

export function rewatchCandidates(movieIds: number[], favorites: number[]): number[] {
  const favSet = new Set(favorites);
  return movieIds.filter((id) => favSet.has(id)).slice(0, 12);
}

export type RewatchSignalLevel = "high" | "moderate" | "low" | "insufficient_data";

export function buildRewatchSignals(history: number[], favorites: number[]): Array<{
  movieId: number;
  level: RewatchSignalLevel;
  reasons: string[];
}> {
  const favSet = new Set(favorites);
  const historyCounts = new Map<number, number>();
  for (const id of history) historyCounts.set(id, (historyCounts.get(id) ?? 0) + 1);

  const signals: Array<{ movieId: number; level: RewatchSignalLevel; reasons: string[] }> = [];
  for (const [movieId, count] of historyCounts) {
    const reasons: string[] = [];
    let level: RewatchSignalLevel = "low";
    if (favSet.has(movieId)) {
      reasons.push("In both watch history and favorites.");
      level = count >= 2 ? "high" : "moderate";
    } else if (count >= 2) {
      reasons.push(`Appears ${count} times in watch history.`);
      level = "moderate";
    } else {
      reasons.push("Single history entry without favorite signal.");
      level = "low";
    }
    signals.push({ movieId, level, reasons });
  }

  return signals.sort((a, b) => {
    const rank = { high: 3, moderate: 2, low: 1, insufficient_data: 0 };
    return rank[b.level] - rank[a.level];
  });
}

/** Plain-language explanations backed by real computed signals — never invented. */
export function buildTasteExplanations(dna: TasteDna, favoritesCount = 0): string[] {
  const lines: string[] = [];
  if (dna.genres[0]) {
    lines.push(`Your most frequent genre signal is ${dna.genres[0].name} (${dna.genres[0].count} titles, ${dna.genres[0].percent}% of genre tags).`);
  }
  if (dna.avgRuntime) {
    lines.push(`You usually watch movies around ${dna.avgRuntime} minutes based on ${dna.movieCount} catalog titles in your signals.`);
  }
  if (dna.decades[0]) {
    lines.push(`Most of your watched/saved titles are from the ${dna.decades[0].decade}s (${dna.decades[0].count} films).`);
  }
  if (dna.languages[0]) {
    lines.push(`Primary language signal: ${dna.languages[0].code} (${dna.languages[0].count} titles).`);
  }
  if (dna.countries[0]) {
    lines.push(`Frequent production country: ${dna.countries[0].name} (${dna.countries[0].count} titles).`);
  }
  if (favoritesCount > 0) {
    lines.push(`You have ${favoritesCount} favorited movies in your library.`);
  }
  if (dna.unexploredGenres.length) {
    lines.push(`You haven't explored much ${dna.unexploredGenres.slice(0, 2).join(" or ")} yet — based on genre gaps in your history.`);
  }
  return lines;
}

export function tasteContradictions(dna: TasteDna): string[] {
  if (dna.movieCount < 3) return [];

  const notes: string[] = [];
  const top = dna.genres[0];
  const second = dna.genres[1];

  if (top && second && top.percent >= 25 && second.percent >= 20) {
    const slowGenres = new Set(["Drama", "Romance", "Documentary"]);
    const fastGenres = new Set(["Action", "Thriller", "Horror"]);
    if (slowGenres.has(top.name) && fastGenres.has(second.name)) {
      notes.push(
        `You frequently save ${top.name.toLowerCase()} titles (${top.count} films) while also favoring ${second.name.toLowerCase()} (${second.count} films).`,
      );
    }
  }

  if (dna.avgRuntime && dna.avgRuntime > 140 && dna.genres.some((g) => g.name === "Action")) {
    notes.push(`Your average runtime is ${dna.avgRuntime} minutes, including action titles — longer than typical action viewing.`);
  }

  if (dna.languages.length >= 2 && dna.genres[0]) {
    const primaryLang = dna.languages[0];
    const secondaryLang = dna.languages[1];
    if (primaryLang.count >= 2 && secondaryLang.count >= 2) {
      notes.push(
        `You watch both ${primaryLang.code} and ${secondaryLang.code} language films while leaning toward ${dna.genres[0].name}.`,
      );
    }
  }

  return notes;
}

export async function buildTasteEvolutionTimeline(userId: string) {
  let snapshots: Awaited<ReturnType<typeof listTasteSnapshots>> = [];
  try {
    snapshots = await listTasteSnapshots(userId);
  } catch {
    snapshots = [];
  }
  if (snapshots.length < 2) {
    return {
      status: "insufficient_data" as const,
      message: "Taste evolution is still building — need at least two taste snapshots.",
      timeline: [],
    };
  }

  return {
    status: "success" as const,
    timeline: snapshots.map((snap) => ({
      at: snap.createdAt,
      topGenres: (snap.dna.genres as Array<{ name: string; count: number }> | undefined)?.slice(0, 5) ?? [],
      movieCount: (snap.dna.movieCount as number | undefined) ?? null,
    })),
    labels: [trustBadge("user"), trustBadge("metadata")],
  };
}

export async function buildMovieDnaProfile(movieId: number) {
  const movie = await getMovie(movieId);
  if (!movie) return null;

  return {
    movieId: movie.id,
    title: movie.title,
    dimensions: {
      genres: movie.genres.map((g) => g.name),
      keywords: movie.keywords?.map((k) => k.name) ?? [],
      era: movie.year ? `${Math.floor(movie.year / 10) * 10}s` : null,
      runtime: movie.runtime,
      language: movie.originalLanguage,
      countries: movie.productionCountries.map((c) => c.name),
      cast: movie.credits.cast.slice(0, 6).map((c) => c.name),
      crew: movie.credits.crew
        .filter((c) => c.job === "Director")
        .slice(0, 3)
        .map((c) => c.name),
      ratings: {
        tmdb: movie.tmdbRating ?? movie.voteAverage,
        imdb: movie.imdbRating,
      },
    },
    labels: [trustBadge("metadata")],
    analysisNote: "Theme/pacing/mood interpretations are AI analysis — metadata above is verified.",
  };
}
