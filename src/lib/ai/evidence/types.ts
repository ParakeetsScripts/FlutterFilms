import type { CatalogMovie } from "@/lib/sync/types";
import { formatSourceConflict } from "@/lib/sync/identity";

export type EvidenceSource = {
  source: "tmdb" | "imdb" | "flutter_films" | "user";
  field?: string;
  recordId?: string;
  retrievedAt?: string | null;
  sourceVersion?: string | null;
};

export type ProvenanceField = {
  field: string;
  value: unknown;
  source: EvidenceSource["source"];
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
    keywords?: string[];
    overview?: string | null;
    tagline?: string | null;
    imdbId?: string | null;
  };
  imdb?: {
    id?: string | null;
    rating?: number | null;
    voteCount?: number | null;
    runtime?: number | null;
  };
  cast?: string[];
  crew?: string[];
  conflicts?: Array<{ field: string; tmdb?: string; imdb?: string; note: string }>;
  provenance: ProvenanceField[];
  sources: EvidenceSource[];
};

export type UserTasteEvidence = {
  favoriteCount: number;
  historyCount: number;
  watchlistCount: number;
  topGenres: string[];
  favoritePeople: string[];
  favoriteLanguages: string[];
  sources: EvidenceSource[];
};

export type EvidencePacket = {
  movies: MovieEvidence[];
  userTaste?: UserTasteEvidence;
  sourcesUsed: string[];
  textBlock: string;
};

export function movieEvidenceFromCatalog(movie: CatalogMovie): MovieEvidence {
  const sources: EvidenceSource[] = [
    {
      source: "tmdb",
      recordId: String(movie.id),
      retrievedAt: movie.lastSyncedAt,
      sourceVersion: movie.sourceVersion,
    },
  ];
  const provenance: ProvenanceField[] = [
    { field: "title", value: movie.title, source: "tmdb", retrievedAt: movie.lastSyncedAt },
    { field: "runtime", value: movie.runtime, source: "tmdb", retrievedAt: movie.lastSyncedAt },
    { field: "releaseDate", value: movie.releaseDate, source: "tmdb", retrievedAt: movie.lastSyncedAt },
    {
      field: "tmdbRating",
      value: movie.tmdbRating ?? movie.voteAverage,
      source: "tmdb",
      retrievedAt: movie.ratingsUpdatedAt,
    },
  ];

  if (movie.imdbId) {
    sources.push({
      source: "imdb",
      recordId: movie.imdbId,
      retrievedAt: movie.ratingsUpdatedAt,
    });
    provenance.push({
      field: "imdbRating",
      value: movie.imdbRating,
      source: "imdb",
      retrievedAt: movie.ratingsUpdatedAt,
    });
    if (movie.imdbVoteCount != null) {
      provenance.push({
        field: "imdbVoteCount",
        value: movie.imdbVoteCount,
        source: "imdb",
        retrievedAt: movie.ratingsUpdatedAt,
      });
    }
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
      keywords: movie.keywords?.map((k) => k.name),
      overview: movie.overview,
      tagline: movie.tagline,
      imdbId: movie.imdbId,
    },
    imdb: {
      id: movie.imdbId,
      rating: movie.imdbRating,
      voteCount: movie.imdbVoteCount,
      runtime: movie.runtimeConflict?.imdb ?? null,
    },
    cast: movie.credits?.cast?.slice(0, 8).map((c) => c.name),
    crew: movie.credits?.crew
      ?.filter((c) => c.job && ["Director", "Writer", "Screenplay"].includes(c.job))
      .slice(0, 4)
      .map((c) => `${c.name} (${c.job})`),
    conflicts: formatSourceConflict(movie),
    provenance,
    sources,
  };
}
