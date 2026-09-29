"use client";

import { ChapterIndex } from "@/components/cinematic/ChapterIndex";
import { CinematicScene } from "@/components/cinematic/CinematicScene";
import { AnimatedCount } from "@/components/discover/AnimatedCount";
import { CatalogArchive } from "@/components/discover/CatalogArchive";
import { CatalogConstellation } from "@/components/discover/CatalogConstellation";
import { CatalogFocusPanel } from "@/components/discover/CatalogFocusPanel";
import { FilterDrawer } from "@/components/discover/FilterDrawer";
import { ViewModeSwitcher } from "@/components/discover/ViewModeSwitcher";
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieRow } from "@/components/movie/MovieRow";
import {
  clearReturnPoint,
  getCatalogViewSnapshot,
  peekReturnPoint,
  readCatalogSession,
  setCatalogView,
  setReturnPoint,
  subscribeCatalogView,
  writeCatalogSession,
} from "@/lib/discover/catalog-session";
import {
  DEFAULT_CATALOG_VIEW,
  TMDB_MAX_PAGE,
  appendUnique,
  chunkRows,
  clampPage,
  lockedCinemaColumns,
  formatCount,
  formatPageCount,
  formatResultCount,
  isCappedTotal,
  maxReachablePage,
} from "@/lib/discover/catalog-view";
import { cssVars } from "@/lib/motion/css-vars";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

export type DiscoverCatalogProps = {
  queryKey: string;
  searchParams: Record<string, string>;
  title: string;
  sortLabel: string;
  filtersActive: boolean;
  contextNotes: string[];
  initial: { page: number; totalPages: number; totalResults: number; results: MovieSummary[] };
  trending: MovieSummary[];
};

type LoadState = "idle" | "loading" | "error";

const CINEMA_COLUMNS_DEFAULT = 5;
const FOCUS_DELAY_MS = 160;
const RESTORE_WINDOW_MS = 1400;
const HERO_PRINT_SOURCES = 28;
/** The floor repeats real posters to fill 11×4 tiles; it is decoration, not a result count. */
const HERO_FLOOR_TILES = 44;

const noopSubscribe = () => () => {};

function pageHref(params: Record<string, string>, page: number): string {
  const next = new URLSearchParams(params);
  if (page > 1) next.set("page", String(page));
  else next.delete("page");
  const qs = next.toString();
  return qs ? `/movies?${qs}` : "/movies";
}

/**
 * Discover as a spatial catalog. The server renders page data; this layer owns presentation
 * (view mode, focus, camera) and never changes the catalog query except through real links.
 */
export function DiscoverCatalog(props: DiscoverCatalogProps) {
  const { queryKey, searchParams, initial, trending } = props;
  const router = useRouter();
  const view = useSyncExternalStore(subscribeCatalogView, getCatalogViewSnapshot, () => DEFAULT_CATALOG_VIEW);
  const restored = useSyncExternalStore(noopSubscribe, () => readCatalogSession(queryKey), () => null);
  const usable = restored && restored.firstPage === initial.page ? restored : null;

  const [extra, setExtra] = useState<{ movies: MovieSummary[]; lastPage: number } | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [reorganizing, setReorganizing] = useState(false);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [columns, setColumns] = useState(CINEMA_COLUMNS_DEFAULT);
  const wallRef = useRef<HTMLDivElement>(null);
  const focusTimer = useRef(0);
  const [initialIds] = useState(() => new Set(initial.results.map((movie) => movie.id)));

  const movies = extra?.movies ?? usable?.movies ?? initial.results;
  const lastPage = extra?.lastPage ?? usable?.lastPage ?? initial.page;
  const maxPage = maxReachablePage(initial.totalPages);
  const focused = focusId === null ? null : (movies.find((movie) => movie.id === focusId) ?? null);
  const rows = useMemo(() => chunkRows(movies, columns), [movies, columns]);
  const heroPrints = useMemo(() => {
    const sources = [...trending, ...initial.results].filter((movie) => movie.posterPath).slice(0, HERO_PRINT_SOURCES);
    if (!sources.length) return [];
    return Array.from({ length: HERO_FLOOR_TILES }, (_, index) => sources[index % sources.length]);
  }, [trending, initial.results]);

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = lockedCinemaColumns(entry.contentRect.width);
      setColumns((current) => (current === next ? current : next));
    });
    setColumns(lockedCinemaColumns(wall.getBoundingClientRect().width));
    observer.observe(wall);
    return () => observer.disconnect();
  }, [view]);

  useEffect(() => {
    const point = peekReturnPoint(queryKey);
    if (!point) return;
    // Next.js runs its own post-navigation scroll after mount, so hold the saved position
    // briefly — and hand control back the moment the viewer scrolls or types.
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const deadline = performance.now() + RESTORE_WINDOW_MS;
    let frame = 0;
    let stableFrames = 0;
    let cancelled = false;
    const release = () => {
      root.style.scrollBehavior = previousBehavior;
    };
    const cancel = () => {
      cancelled = true;
      clearReturnPoint();
      release();
    };
    const hold = () => {
      if (cancelled) return;
      if (Math.abs(window.scrollY - point.scrollY) > 4) {
        stableFrames = 0;
        window.scrollTo({ top: point.scrollY, behavior: "instant" });
      } else {
        stableFrames += 1;
      }
      if (performance.now() < deadline || stableFrames < 3) {
        frame = requestAnimationFrame(hold);
      } else {
        clearReturnPoint();
        release();
      }
    };
    frame = requestAnimationFrame(() => {
      if (point.focusId !== null) setFocusId(point.focusId);
      hold();
    });
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("touchstart", cancel, { passive: true, once: true });
    window.addEventListener("keydown", cancel, { once: true });
    return () => {
      cancelAnimationFrame(frame);
      release();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [queryKey]);

  useEffect(() => {
    if (!reorganizing) return;
    const timer = window.setTimeout(() => setReorganizing(false), 4000);
    return () => window.clearTimeout(timer);
  }, [reorganizing]);

  useEffect(() => {
    if (focusId === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

  useEffect(() => () => window.clearTimeout(focusTimer.current), []);

  async function loadMore() {
    const nextPage = lastPage + 1;
    if (nextPage > maxPage || loadState === "loading") return;
    setLoadState("loading");
    try {
      const qs = new URLSearchParams(searchParams);
      qs.set("page", String(nextPage));
      const response = await fetch(`/api/movies/discover-page?${qs.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { results: MovieSummary[] };
      const nextMovies = appendUnique(movies, data.results ?? []);
      setExtra({ movies: nextMovies, lastPage: nextPage });
      writeCatalogSession({ key: queryKey, movies: nextMovies, firstPage: initial.page, lastPage: nextPage, totalPages: initial.totalPages });
      setLoadState("idle");
    } catch {
      setLoadState("error");
    }
  }

  function jumpToPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = new FormData(event.currentTarget).get("page");
    const page = clampPage(Number(raw), initial.totalPages);
    setReorganizing(true);
    router.push(pageHref(searchParams, page));
  }

  function inspect(target: EventTarget | null, immediate: boolean) {
    const cell = target instanceof Element ? target.closest<HTMLElement>("[data-movie-id]") : null;
    if (!cell) return;
    const id = Number(cell.dataset.movieId);
    window.clearTimeout(focusTimer.current);
    if (immediate) setFocusId(id);
    else focusTimer.current = window.setTimeout(() => setFocusId(id), FOCUS_DELAY_MS);
  }

  const showInspector = view !== "archive";

  return (
    <div
      className="catalog"
      data-view={view}
      data-reorganizing={reorganizing ? "true" : undefined}
      onClickCapture={(event) => {
        const link = event.target instanceof Element ? event.target.closest("a[href^='/movie/']") : null;
        if (link) setReturnPoint({ key: queryKey, scrollY: window.scrollY, focusId });
      }}
    >
      <CinematicScene id="catalog-top" className="catalog-hero" aria-labelledby="catalog-title">
        <div className="catalog-hero__field" aria-hidden="true">
          <div className="catalog-hero__plane">
            {heroPrints.map((movie, index) => {
              const src = getPosterUrl(movie.posterPath, "w185");
              return src ? (
                <span key={`${movie.id}-${index}`} className="catalog-hero__print" style={cssVars({ "--i": index })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" decoding="async" loading={index < 14 ? "eager" : "lazy"} />
                </span>
              ) : null;
            })}
          </div>
        </div>
        <div className="catalog-hero__count" aria-hidden="true">
          <AnimatedCount value={initial.totalResults} />
        </div>
        <div className="catalog-hero__copy">
          <p className="chapter-marker">Discover · The catalog</p>
          <h1 id="catalog-title" className="catalog-hero__title">
            {props.title}
          </h1>
          <p className="catalog-hero__orientation">
            <span>
              <AnimatedCount value={initial.totalResults} persist /> titles match your filters
            </span>
            <span>Sorted by {props.sortLabel}</span>
            <span>
              Page {formatCount(initial.page)} of {formatPageCount(initial.totalPages)}
            </span>
            {isCappedTotal(initial.totalResults) ? <span>TMDB reports large result sets as 20,000+</span> : null}
            {props.contextNotes.map((note) => (
              <span key={note}>{note}</span>
            ))}
            {!props.filtersActive ? <span>Browse TMDB&apos;s full global catalog</span> : null}
          </p>
        </div>
      </CinematicScene>

      <div id="catalog-filters" className="catalog-console page-container">
        <Suspense>
          <FilterDrawer onNavigate={() => setReorganizing(true)} />
        </Suspense>
      </div>

      {!props.filtersActive && trending.length > 0 ? (
        <CinematicScene id="trending" chapter={{ index: 1, label: "Trending" }} className="catalog-chapter" aria-labelledby="catalog-trending-title">
          <div className="page-container">
            <header className="catalog-chapter__head">
              <div>
                <p className="chapter-marker">01 — The pulse</p>
                <h2 id="catalog-trending-title" className="catalog-chapter__title">
                  Trending now
                </h2>
              </div>
              <p className="catalog-chapter__note">Global trending — not filtered</p>
            </header>
            <MovieRow title="" movies={trending.slice(0, 16)} spotlight bare railId="movies-trending" depth="arc" />
          </div>
        </CinematicScene>
      ) : null}

      <CinematicScene
        id="catalog"
        chapter={{ index: props.filtersActive ? 1 : 2, label: "Catalog" }}
        className="catalog-chapter catalog-chapter--results"
        aria-labelledby="catalog-results-title"
      >
        <div className="page-container">
          <header className="catalog-chapter__head">
            <div>
              <p className="chapter-marker">{props.filtersActive ? "01" : "02"} — The archive</p>
              <h2 id="catalog-results-title" className="catalog-chapter__title">
                All results
              </h2>
            </div>
            <p className="catalog-chapter__note">
              Showing {formatCount(movies.length)} of {formatResultCount(initial.totalResults)} · sorted by {props.sortLabel}
            </p>
          </header>

          <div className="catalog-controls">
            <a href="#catalog-filters" className="btn btn-ghost text-sm catalog-controls__filters">
              Filters
            </a>
            <p className="catalog-controls__count">
              <AnimatedCount value={initial.totalResults} /> titles
              <span className="catalog-controls__pages">
                {" "}
                · pages {formatCount(initial.page)}–{formatCount(lastPage)} of {formatPageCount(initial.totalPages)}
              </span>
            </p>
            <ViewModeSwitcher value={view} onChange={setCatalogView} />
          </div>

          {movies.length === 0 ? (
            <div className="catalog-empty" role="status">
              <p className="catalog-empty__title">No titles here</p>
              <p className="catalog-empty__body">Try widening your filters.</p>
              <Link href="/movies" className="btn btn-primary">
                Reset filters
              </Link>
            </div>
          ) : (
            <div className={`catalog-layout ${showInspector ? "catalog-layout--inspector" : ""}`}>
              <div
                className="catalog-ruler"
                aria-hidden="true"
                style={cssVars({
                  "--loaded": `${Math.min(100, Math.round((movies.length / Math.max(initial.totalResults, 1)) * 100))}%`,
                })}
              >
                <span className="catalog-ruler__fill" />
              </div>
              <div
                ref={wallRef}
                className="catalog-wall"
                onPointerOver={(event) => inspect(event.target, false)}
                onPointerLeave={() => window.clearTimeout(focusTimer.current)}
                onFocus={(event) => inspect(event.target, true)}
              >
                {view === "archive" ? (
                  <CatalogArchive movies={movies} firstPage={initial.page} />
                ) : view === "constellation" ? (
                  <CatalogConstellation movies={movies} focusId={focusId} />
                ) : view === "grid" ? (
                  <div className="movie-grid catalog-grid">
                    {movies.map((movie, index) => (
                      <div
                        key={movie.id}
                        className="catalog-cell"
                        data-movie-id={movie.id}
                        data-focused={movie.id === focusId ? "true" : undefined}
                        data-fresh={initialIds.has(movie.id) ? undefined : "true"}
                        style={cssVars({ "--i": index % 12 })}
                      >
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="catalog-rows" style={cssVars({ "--cols": columns })}>
                    {rows.map((row, rowIndex) => (
                      <CinematicScene key={`${row[0]?.id ?? rowIndex}-${columns}`} id={`catalog-row-${rowIndex}`} as="div" className="catalog-row">
                        {row.map((movie, cellIndex) => (
                          <div
                            key={movie.id}
                            className="catalog-cell"
                            data-movie-id={movie.id}
                            data-focused={movie.id === focusId ? "true" : undefined}
                            data-fresh={initialIds.has(movie.id) ? undefined : "true"}
                            style={cssVars({ "--i": (rowIndex * columns + cellIndex) % 12 })}
                          >
                            <MovieCard movie={movie} variant="spotlight" />
                          </div>
                        ))}
                      </CinematicScene>
                    ))}
                  </div>
                )}
              </div>
              {showInspector ? <CatalogFocusPanel movie={focused} onClose={() => setFocusId(null)} /> : null}
            </div>
          )}

          {movies.length > 0 ? (
            <div className="catalog-more">
              {lastPage < maxPage ? (
                <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loadState === "loading"}>
                  {loadState === "loading" ? `Loading page ${lastPage + 1}…` : `Load more · page ${lastPage + 1} of ${formatPageCount(initial.totalPages)}`}
                </button>
              ) : (
                <p className="catalog-more__note">End of the reachable catalog for these filters.</p>
              )}
              {loadState === "error" ? (
                <p className="catalog-more__note" role="alert">
                  Page {lastPage + 1} couldn&apos;t be loaded. Your current results are still here — try again.
                </p>
              ) : null}
              <p className="sr-only" aria-live="polite">
                {loadState === "loading" ? "Loading more titles." : `${movies.length} titles loaded.`}
              </p>
              <div className="catalog-more__row">
                {initial.page > 1 ? (
                  <Link href={pageHref(searchParams, initial.page - 1)} className="btn btn-ghost text-sm">
                    Previous page
                  </Link>
                ) : null}
                <form className="catalog-jump" onSubmit={jumpToPage}>
                  <label className="catalog-jump__label" htmlFor="catalog-jump-page">
                    Jump to page
                  </label>
                  <input
                    id="catalog-jump-page"
                    name="page"
                    type="number"
                    min={1}
                    max={maxPage}
                    defaultValue={initial.page}
                    className="catalog-jump__input"
                  />
                  <span className="catalog-jump__max">/ {formatCount(maxPage)}</span>
                  <button type="submit" className="btn btn-ghost text-sm">
                    Go
                  </button>
                </form>
              </div>
              {initial.totalPages > TMDB_MAX_PAGE ? (
                <p className="catalog-more__note">TMDB serves the first {TMDB_MAX_PAGE} pages of any result set; narrow filters to reach the rest.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CinematicScene>

      <ChapterIndex label="Discover chapters" />
    </div>
  );
}
