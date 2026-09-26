type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheKey(parts: Array<string | number | null | undefined>): string {
  return parts.map((part) => (part == null ? "" : String(part))).join(":");
}

export const CACHE_TTL = {
  configuration: 24 * 60 * 60 * 1000,
  genres: 12 * 60 * 60 * 1000,
  list: 15 * 60 * 1000,
  detail: 30 * 60 * 1000,
  search: 5 * 60 * 1000,
  providers: 6 * 60 * 60 * 1000,
};
