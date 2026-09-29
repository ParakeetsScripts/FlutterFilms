import "server-only";

import { cacheKey, CACHE_TTL } from "./cache";
import { tmdbFetch } from "./client";
import type { Video } from "./types";
import { normalizeTmdbVideos } from "./videos";

/** Fetch videos from TMDB, trying localized then English catalogs. */
export async function fetchMovieVideos(tmdbId: number, language?: string): Promise<Video[]> {
  const languages = [language, "en-US", undefined].filter(
    (value, index, list) => value !== list[index - 1],
  );

  for (const lang of languages) {
    try {
      const raw = await tmdbFetch<{ results?: Array<Record<string, unknown>> }>(
        `/movie/${tmdbId}/videos`,
        lang ? { language: lang } : {},
        {
          ttlMs: CACHE_TTL.detail,
          cacheKey: cacheKey(["movie-videos", tmdbId, lang ?? "default"]),
        },
      );
      const videos = normalizeTmdbVideos(raw.results as Parameters<typeof normalizeTmdbVideos>[0]);
      if (videos.length) return videos;
    } catch {
      // Try the next language fallback.
    }
  }

  return [];
}

export async function resolveMovieVideos(
  tmdbId: number,
  existing: Video[] | undefined,
  language?: string,
): Promise<Video[]> {
  if (existing?.length) return existing;
  return fetchMovieVideos(tmdbId, language);
}
