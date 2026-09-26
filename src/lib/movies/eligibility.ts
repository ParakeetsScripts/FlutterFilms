import type { MovieSummary } from "@/lib/tmdb/types";

/** ISO date string (YYYY-MM-DD) for today in UTC. */
export function todayIso(asOf = new Date()): string {
  return asOf.toISOString().slice(0, 10);
}

/** Best-effort release date from TMDB summary fields. */
export function resolveReleaseDate(movie: Pick<MovieSummary, "releaseDate" | "year">): string | null {
  if (movie.releaseDate) return movie.releaseDate;
  if (movie.year != null) return `${movie.year}-01-01`;
  return null;
}

export function isReleasedByToday(
  movie: Pick<MovieSummary, "releaseDate" | "year">,
  asOf = new Date(),
): boolean {
  const iso = resolveReleaseDate(movie);
  if (!iso) return false;
  return iso <= todayIso(asOf);
}

export function hasKnownRuntime(runtime: number | null | undefined): boolean {
  return typeof runtime === "number" && runtime > 0;
}

export function meetsRuntimeConstraint(runtime: number | null | undefined, maxRuntime?: number): boolean {
  if (!maxRuntime) return true;
  if (!hasKnownRuntime(runtime)) return false;
  return runtime! <= maxRuntime;
}

export type WatchableTonightOptions = {
  asOf?: Date;
};

/** Keep only titles released on or before today. Runtime filtering uses TMDB discover at query time. */
export function filterWatchableTonight<T extends MovieSummary>(
  movies: T[],
  options: WatchableTonightOptions = {},
): T[] {
  const { asOf = new Date() } = options;
  return movies.filter((movie) => isReleasedByToday(movie, asOf));
}
