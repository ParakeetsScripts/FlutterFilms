import "server-only";

import { cacheGet, cacheSet } from "./cache";
import { TMDB_API_BASE } from "./constants";

export { TMDB_API_BASE, TMDB_SOURCE_VERSION } from "./constants";

export class TmdbUnavailableError extends Error {
  constructor(message = "Movie data is temporarily unavailable.") {
    super(message);
    this.name = "TmdbUnavailableError";
  }
}

export class TmdbConfigError extends Error {
  constructor(message = "TMDB API credentials are not configured.") {
    super(message);
    this.name = "TmdbConfigError";
  }
}

function getAuth(): { headers: HeadersInit; query: URLSearchParams } {
  const token = process.env.TMDB_API_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  const headers: HeadersInit = { Accept: "application/json" };
  const query = new URLSearchParams();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    return { headers, query };
  }
  if (apiKey) {
    query.set("api_key", apiKey);
    return { headers, query };
  }
  throw new TmdbConfigError();
}

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
  options: { ttlMs?: number; cacheKey?: string } = {},
): Promise<T> {
  const key = options.cacheKey;
  if (key) {
    const cached = cacheGet<T>(key);
    if (cached) return cached;
  }

  const { headers, query } = getAuth();
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(name, String(value));
  }

  const url = `${TMDB_API_BASE}${path}?${query.toString()}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      next: { revalidate: Math.max(60, Math.floor((options.ttlMs ?? 900_000) / 1000)) },
    });
  } catch {
    throw new TmdbUnavailableError();
  }

  if (!response.ok) {
    throw new TmdbUnavailableError();
  }

  const data = (await response.json()) as T;
  if (key && options.ttlMs) {
    cacheSet(key, data, options.ttlMs);
  }
  return data;
}

export function hasTmdbCredentials(): boolean {
  return Boolean(process.env.TMDB_API_TOKEN || process.env.TMDB_API_KEY);
}
