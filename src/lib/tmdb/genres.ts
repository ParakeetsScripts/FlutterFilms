import type { Genre } from "./types";

/** TMDB movie genre IDs — stable catalog reference. */
const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

let lookup: Map<number, string> | null = null;

export function getGenreLookup(): Map<number, string> {
  if (!lookup) lookup = new Map(Object.entries(TMDB_MOVIE_GENRES).map(([id, name]) => [Number(id), name]));
  return lookup;
}

export function genreName(id: number): string {
  return TMDB_MOVIE_GENRES[id] ?? "";
}

export function genreIdForName(name: string): number | null {
  const needle = name.trim().toLowerCase();
  const match = Object.entries(TMDB_MOVIE_GENRES).find(([, label]) => label.toLowerCase() === needle);
  return match ? Number(match[0]) : null;
}

export function genresFromIds(ids: number[]): Genre[] {
  return ids
    .map((id) => ({ id, name: genreName(id) }))
    .filter((genre) => genre.name);
}
