import type { Movie } from "@/lib/tmdb/types";
import { FIELD_PRIORITY } from "./field-priority";
import type { CatalogMovie, StoredMovieRow } from "./types";

function parsePayload(row: StoredMovieRow): Movie {
  const raw = row.payload_json;
  if (typeof raw === "string") return JSON.parse(raw) as Movie;
  return raw as Movie;
}

export function rowToCatalogMovie(row: StoredMovieRow): CatalogMovie {
  const payload = parsePayload(row);
  const tmdbRuntime = payload.runtime;
  const imdbRuntime = row.runtime;
  const runtimeRule = FIELD_PRIORITY.runtime;
  let displayRuntime = row.display_runtime ?? payload.runtime;
  let runtimeConflict: CatalogMovie["runtimeConflict"];

  if (tmdbRuntime != null && imdbRuntime != null && tmdbRuntime !== imdbRuntime) {
    runtimeConflict = {
      tmdb: tmdbRuntime,
      imdb: imdbRuntime,
      selected: runtimeRule.primary === "imdb" ? imdbRuntime : tmdbRuntime,
    };
    displayRuntime = runtimeConflict.selected;
  }

  return {
    ...payload,
    keywords: payload.keywords ?? [],
    releases: payload.releases ?? { certification: null, byRegion: [] },
    runtime: displayRuntime,
    voteAverage: row.tmdb_rating ?? payload.voteAverage,
    voteCount: row.tmdb_vote_count ?? payload.voteCount,
    imdbId: row.imdb_id ?? payload.imdbId,
    tmdbRating: row.tmdb_rating ?? payload.voteAverage,
    tmdbVoteCount: row.tmdb_vote_count ?? payload.voteCount,
    imdbRating: row.imdb_rating,
    imdbVoteCount: row.imdb_vote_count,
    lastSyncedAt: row.last_synced_at,
    metadataUpdatedAt: row.metadata_updated_at,
    ratingsUpdatedAt: row.ratings_updated_at,
    metadataCompleteness: row.metadata_completeness,
    retrievedAt: row.last_synced_at ?? payload.retrievedAt,
    runtimeConflict,
    sourceRecords: [
      {
        source: "tmdb",
        sourceId: String(row.tmdb_id),
        lastFetchedAt: row.last_synced_at,
        lastModifiedAt: row.metadata_updated_at,
        sourceVersion: payload.sourceVersion,
        dataHash: null,
        status: row.tmdb_rating != null ? "CURRENT" : "MISSING",
        rawReference: null,
      },
      {
        source: "imdb",
        sourceId: row.imdb_id ?? "",
        lastFetchedAt: row.ratings_updated_at,
        lastModifiedAt: row.ratings_updated_at,
        sourceVersion: null,
        dataHash: null,
        status: row.imdb_id ? (row.imdb_rating != null ? "CURRENT" : "MISSING") : "MISSING",
        rawReference: row.imdb_id ? `https://www.imdb.com/title/${row.imdb_id}/` : null,
      },
    ],
  };
}

export function summaryFromCatalog(movie: CatalogMovie) {
  return {
    id: movie.id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    originalTitle: movie.originalTitle,
    overview: movie.overview,
    releaseDate: movie.releaseDate,
    year: movie.year,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    voteAverage: movie.tmdbRating ?? movie.voteAverage,
    voteCount: movie.tmdbVoteCount ?? movie.voteCount,
    popularity: movie.popularity,
    originalLanguage: movie.originalLanguage,
    genres: movie.genres,
    adult: movie.adult,
    source: movie.source,
    sourceVersion: movie.sourceVersion,
    retrievedAt: movie.retrievedAt,
    imdbRating: movie.imdbRating,
    metadataUpdatedAt: movie.metadataUpdatedAt,
  };
}
