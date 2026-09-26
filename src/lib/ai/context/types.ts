import type { CatalogMovie } from "@/lib/sync/types";

export type SourceReference = {
  source: "tmdb" | "imdb" | "flutter_films" | "user";
  field?: string;
  recordId?: string;
  retrievedAt?: string | null;
};

export type MovieEvidence = {
  movieId: number;
  title: string;
  year?: number | null;
  tmdb?: {
    rating?: number | null;
    voteCount?: number | null;
    runtime?: number | null;
    releaseDate?: string | null;
    genres?: string[];
    overview?: string | null;
    tagline?: string | null;
  };
  imdb?: {
    id?: string | null;
    rating?: number | null;
    voteCount?: number | null;
  };
  cast?: string[];
  crew?: string[];
  sources: SourceReference[];
};

export type UserTasteEvidence = {
  favoriteCount: number;
  historyCount: number;
  watchlistCount: number;
  topGenres: string[];
  sources: SourceReference[];
};

export type EvidencePacket = {
  movies: MovieEvidence[];
  userTaste?: UserTasteEvidence;
  sourcesUsed: string[];
  textBlock: string;
};

export function movieEvidenceFromCatalog(movie: CatalogMovie): MovieEvidence {
  const sources: SourceReference[] = [
    { source: "tmdb", recordId: String(movie.id), retrievedAt: movie.lastSyncedAt },
  ];
  if (movie.imdbId) {
    sources.push({ source: "imdb", recordId: movie.imdbId, retrievedAt: movie.ratingsUpdatedAt });
  }
  return {
    movieId: movie.id,
    title: movie.title,
    year: movie.year,
    tmdb: {
      rating: movie.tmdbRating ?? movie.voteAverage,
      voteCount: movie.tmdbVoteCount ?? movie.voteCount,
      runtime: movie.runtime,
      releaseDate: movie.releaseDate,
      genres: movie.genres?.map((g) => g.name),
      overview: movie.overview,
      tagline: movie.tagline,
    },
    imdb: {
      id: movie.imdbId,
      rating: movie.imdbRating,
      voteCount: movie.imdbVoteCount,
    },
    cast: movie.credits?.cast?.slice(0, 8).map((c) => c.name),
    crew: movie.credits?.crew
      ?.filter((c) => c.job && ["Director", "Writer", "Screenplay"].includes(c.job))
      .slice(0, 4)
      .map((c) => `${c.name} (${c.job})`),
    sources,
  };
}
