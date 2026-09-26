import "server-only";

import { getMovie } from "@/lib/tmdb/movies";
import type { Movie } from "@/lib/tmdb/types";
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

  const allGenres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Animation", "Thriller", "Romance"];
  const unexploredGenres = allGenres.filter((g) => !genreCounts.has(g));

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
  const notes: string[] = [];
  const top = dna.genres[0]?.name;
  const also = dna.genres[1]?.name;
  if (top === "Horror" && also === "Comedy") notes.push("You gravitate toward horror and comedy — an uncommon but well-documented pairing.");
  if (dna.avgRuntime && dna.avgRuntime > 150 && dna.genres.some((g) => g.name === "Action")) {
    notes.push("You favor long runtimes even in action-heavy taste — prediction based on your history.");
  }
  return notes;
}
