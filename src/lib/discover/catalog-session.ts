import type { MovieSummary } from "@/lib/tmdb/types";
import { parseCatalogView, type CatalogViewMode } from "./catalog-view";

/**
 * Session memory for Discover: loaded pages per query, the return point when a movie is
 * opened, and the last result count (so a new count can animate from the old one).
 * Snapshots are cached so `useSyncExternalStore` sees stable references.
 */

export type CatalogSession = {
  key: string;
  movies: MovieSummary[];
  firstPage: number;
  lastPage: number;
  totalPages: number;
  savedAt: number;
};

const SESSION_PREFIX = "ff.catalog:";
const RETURN_KEY = "ff.catalog.return";
const COUNT_KEY = "ff.catalog.count";
const VIEW_KEY = "ff.catalog.view";
const SESSION_TTL_MS = 30 * 60 * 1000;

const sessionCache = new Map<string, CatalogSession | null>();

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage unavailable — memory only for this page view.
  }
}

export function readCatalogSession(key: string): CatalogSession | null {
  if (sessionCache.has(key)) return sessionCache.get(key) ?? null;
  let session: CatalogSession | null = null;
  const raw = safeGet(typeof window === "undefined" ? undefined : sessionStorage, SESSION_PREFIX + key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CatalogSession;
      if (parsed.key === key && Date.now() - parsed.savedAt < SESSION_TTL_MS && Array.isArray(parsed.movies)) {
        session = parsed;
      }
    } catch {
      session = null;
    }
  }
  sessionCache.set(key, session);
  return session;
}

export function writeCatalogSession(session: Omit<CatalogSession, "savedAt">) {
  const value: CatalogSession = { ...session, savedAt: Date.now() };
  sessionCache.set(session.key, value);
  safeSet(sessionStorage, SESSION_PREFIX + session.key, JSON.stringify(value));
}

export type ReturnPoint = { key: string; scrollY: number; focusId: number | null };

export function setReturnPoint(point: ReturnPoint) {
  safeSet(sessionStorage, RETURN_KEY, JSON.stringify(point));
}

/** Reads without removing, so a Strict Mode effect re-run still finds the point. */
export function peekReturnPoint(key: string): ReturnPoint | null {
  const raw = safeGet(sessionStorage, RETURN_KEY);
  if (!raw) return null;
  try {
    const point = JSON.parse(raw) as ReturnPoint;
    return point.key === key ? point : null;
  } catch {
    return null;
  }
}

export function clearReturnPoint() {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function readLastCount(): number | null {
  const raw = safeGet(sessionStorage, COUNT_KEY);
  const value = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function writeLastCount(count: number) {
  safeSet(sessionStorage, COUNT_KEY, String(count));
}

let viewSnapshot: CatalogViewMode | null = null;
const viewListeners = new Set<() => void>();

export function getCatalogViewSnapshot(): CatalogViewMode {
  if (viewSnapshot === null) viewSnapshot = parseCatalogView(safeGet(localStorage, VIEW_KEY));
  return viewSnapshot;
}

export function subscribeCatalogView(listener: () => void): () => void {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

export function setCatalogView(view: CatalogViewMode) {
  viewSnapshot = view;
  safeSet(localStorage, VIEW_KEY, view);
  for (const listener of viewListeners) listener();
}
