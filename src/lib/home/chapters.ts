import type { HomeSection } from "@/lib/home";
import type { DiscoverQuery, MovieSummary } from "@/lib/tmdb/types";

export type LibraryIds = { history: number[]; favorites: number[]; watchlist: number[] };

export function sectionMovies(sections: HomeSection[], id: string): MovieSummary[] {
  return sections.find((section) => section.id === id)?.movies ?? [];
}

export function uniqueById(movies: MovieSummary[]): MovieSummary[] {
  const seen = new Set<number>();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

/** Top-rated titles, minus anything already in the viewer's history, favorites, or watchlist. */
export function selectExplore(sections: HomeSection[], library: LibraryIds, limit = 16) {
  const known = new Set([...library.history, ...library.favorites, ...library.watchlist]);
  const movies = uniqueById(sectionMovies(sections, "top-rated"))
    .filter((movie) => !known.has(movie.id))
    .slice(0, limit);
  return { movies, excludesLibrary: known.size > 0 };
}

export type NewReleaseBasis = "now-playing" | "upcoming" | "none";

export function selectNewReleases(sections: HomeSection[], limit = 16): { movies: MovieSummary[]; basis: NewReleaseBasis } {
  const nowPlaying = sectionMovies(sections, "new-releases");
  if (nowPlaying.length) return { movies: nowPlaying.slice(0, limit), basis: "now-playing" };
  const upcoming = sectionMovies(sections, "upcoming");
  if (upcoming.length) return { movies: upcoming.slice(0, limit), basis: "upcoming" };
  return { movies: [], basis: "none" };
}

/**
 * "Strong ratings with lower mainstream noise", made literal and shared by the home query,
 * the load-more API, and the on-screen label.
 */
export const LOWER_NOISE_RULES = {
  minRating: 7.2,
  minVotes: 300,
  maxVotes: 3000,
  minResults: 6,
  pageSize: 24,
  fetchedPages: 4,
} as const;

export function lowerNoiseQuery(page: number, asOf: Date, prefs: Pick<DiscoverQuery, "uiLanguage" | "region" | "originalLanguage"> = {}): DiscoverQuery {
  return {
    ...prefs,
    page,
    sort: "rating",
    ratingGte: LOWER_NOISE_RULES.minRating,
    voteCountGte: LOWER_NOISE_RULES.minVotes,
    voteCountLte: LOWER_NOISE_RULES.maxVotes,
    releaseDateLte: asOf.toISOString().slice(0, 10),
  };
}

export function isLowerNoise(movie: MovieSummary): boolean {
  const votes = movie.voteCount ?? 0;
  return (
    (movie.voteAverage ?? 0) >= LOWER_NOISE_RULES.minRating &&
    votes >= LOWER_NOISE_RULES.minVotes &&
    votes <= LOWER_NOISE_RULES.maxVotes
  );
}

/** Drops anything on today's mainstream lists or explicitly excluded, and re-checks the vote band. */
export function filterLowerNoise(movies: MovieSummary[], mainstream: Set<number>, exclude: Set<number> = new Set()): MovieSummary[] {
  return uniqueById(movies).filter((movie) => !mainstream.has(movie.id) && !exclude.has(movie.id) && isLowerNoise(movie));
}

export function mainstreamIds(sections: HomeSection[]): Set<number> {
  return new Set([...sectionMovies(sections, "trending"), ...sectionMovies(sections, "popular")].map((movie) => movie.id));
}

export type LowerNoiseBasis = "lower-noise" | "top-rated" | "none";

export function selectLowerNoise(
  sections: HomeSection[],
  exclude: Set<number>,
): { movies: MovieSummary[]; reserve: MovieSummary[]; basis: LowerNoiseBasis } {
  const pool = filterLowerNoise(sectionMovies(sections, "lower-noise"), mainstreamIds(sections), exclude);
  if (pool.length >= LOWER_NOISE_RULES.minResults) {
    return {
      movies: pool.slice(0, LOWER_NOISE_RULES.pageSize),
      reserve: pool.slice(LOWER_NOISE_RULES.pageSize),
      basis: "lower-noise",
    };
  }

  const topRated = uniqueById(sectionMovies(sections, "top-rated")).filter((movie) => !exclude.has(movie.id));
  return topRated.length
    ? { movies: topRated.slice(0, LOWER_NOISE_RULES.pageSize), reserve: [], basis: "top-rated" }
    : { movies: [], reserve: [], basis: "none" };
}

export type LowerNoiseSort = "rating" | "votes" | "newest";

export function sortLowerNoise(movies: MovieSummary[], sort: LowerNoiseSort): MovieSummary[] {
  const list = [...movies];
  if (sort === "votes") return list.sort((a, b) => (a.voteCount ?? 0) - (b.voteCount ?? 0));
  if (sort === "newest") return list.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  return list.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0) || (a.voteCount ?? 0) - (b.voteCount ?? 0));
}
