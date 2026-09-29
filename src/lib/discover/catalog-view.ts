import { LANGUAGES } from "@/lib/regions";
import type { MovieSummary } from "@/lib/tmdb/types";

export function languageName(code: string | null | undefined): string | null {
  if (!code) return null;
  return LANGUAGES.find((language) => language.code === code)?.name ?? code.toUpperCase();
}

/** Presentation state only — never part of the catalog query. */
export type CatalogViewMode = "grid" | "archive";

export const CATALOG_VIEW_MODES: ReadonlyArray<{ id: CatalogViewMode; label: string; hint: string }> = [
  { id: "grid", label: "Grid", hint: "Poster grid" },
  { id: "archive", label: "Archive", hint: "Dense index" },
];

export const DEFAULT_CATALOG_VIEW: CatalogViewMode = "grid";

/** TMDB discover serves pages 1–500 regardless of the reported total. */
export const TMDB_MAX_PAGE = 500;

export const CATALOG_PAGE_SIZE = 20;

export function parseCatalogView(raw: string | null | undefined): CatalogViewMode {
  if (raw === "grid" || raw === "archive") return raw;
  // Migrate removed presentation modes
  if (raw === "cinema" || raw === "constellation" || raw === "orbit") return "grid";
  return DEFAULT_CATALOG_VIEW;
}

/** Stable identity for a catalog query: sorted params, without page or empty values. */
export function catalogQueryKey(params: Record<string, string | string[] | undefined>): string {
  return Object.entries(params)
    .filter(([key, value]) => key !== "page" && typeof value === "string" && value !== "")
    .map(([key, value]) => `${key}=${value as string}`)
    .sort()
    .join("&");
}

export function maxReachablePage(totalPages: number): number {
  return Math.max(1, Math.min(totalPages, TMDB_MAX_PAGE));
}

export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(maxReachablePage(totalPages), Math.max(1, Math.round(page)));
}

export function ratingLabel(movie: Pick<MovieSummary, "voteAverage">): string {
  return movie.voteAverage ? `TMDB ${movie.voteAverage.toFixed(1)}` : "Rating unavailable";
}

/** 1-based position of a title within the full result ordering. */
export function resultPosition(firstPage: number, index: number, pageSize = CATALOG_PAGE_SIZE): number {
  return (firstPage - 1) * pageSize + index + 1;
}

export function columnsForWidth(width: number, minCard: number, gap: number, maxColumns = 7): number {
  if (width <= 0) return 1;
  return Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minCard + gap))));
}

/** Locked cinema columns per viewport — keeps row chunking aligned with CSS on every device. */
export const CATALOG_CINEMA_COLUMNS: ReadonlyArray<{ minWidth: number; columns: number }> = [
  { minWidth: 1500, columns: 6 },
  { minWidth: 1240, columns: 5 },
  { minWidth: 960, columns: 4 },
  { minWidth: 640, columns: 3 },
  { minWidth: 0, columns: 2 },
];

export function lockedCinemaColumns(width: number): number {
  for (const breakpoint of CATALOG_CINEMA_COLUMNS) {
    if (width >= breakpoint.minWidth) return breakpoint.columns;
  }
  return 2;
}

export function chunkRows<T>(items: T[], columns: number): T[][] {
  const size = Math.max(1, Math.floor(columns));
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function appendUnique(current: MovieSummary[], incoming: MovieSummary[]): MovieSummary[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...incoming.filter((movie) => !seen.has(movie.id))];
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** TMDB reports any result set above 20,000 as exactly 20,001 titles / 1,001 pages. */
export const TMDB_TOTAL_CAP = 20001;
export const TMDB_PAGES_CAP = 1001;

export function isCappedTotal(totalResults: number): boolean {
  return totalResults >= TMDB_TOTAL_CAP;
}

export function formatResultCount(totalResults: number): string {
  return isCappedTotal(totalResults) ? "20,000+" : formatCount(totalResults);
}

export function formatPageCount(totalPages: number): string {
  return totalPages >= TMDB_PAGES_CAP ? "1,000+" : formatCount(totalPages);
}
