import { MovieCard } from "@/components/movie/MovieCard";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { PageError } from "@/components/ui/States";
import { FilterDrawer } from "@/components/discover/FilterDrawer";
import { discoverMovies } from "@/lib/tmdb/discover";
import { getTrendingMovies } from "@/lib/tmdb/movies";
import { parseGenreId, parseLanguage, parsePage, parseRating, parseSort, parseYear } from "@/lib/validation";
import { TmdbUnavailableError } from "@/lib/tmdb/client";
import { Suspense } from "react";

export const revalidate = 600;

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);

  try {
    const query = {
      page: parsePage(value("page")),
      genre: parseGenreId(value("genre")),
      year: parseYear(value("year")),
      yearGte: parseYear(value("yearGte")),
      yearLte: parseYear(value("yearLte")),
      ratingGte: parseRating(value("ratingGte")),
      language: parseLanguage(value("language")),
      sort: parseSort(value("sort")),
    };
    const [trending, discovered] = await Promise.all([
      getTrendingMovies("day").catch(() => ({ results: [] })),
      discoverMovies(query),
    ]);

    return (
      <div className="page-container page-section">
        <header className="page-header">
          <p className="eyebrow">Discover</p>
          <h1 className="page-header__title">Movies</h1>
          <p className="page-header__subtitle">
            Browse the catalog with premium filters. Popularity reflects TMDB audience interest — not editorial “best of” lists.
          </p>
        </header>

        <Suspense>
          <FilterDrawer />
        </Suspense>

        <section className="mt-12">
          <div className="row-section__header">
            <h2 className="row-section__title">Trending Now</h2>
          </div>
          <div className="row-scroller-wrap">
            <div className="row-scroller">
              {trending.results.slice(0, 12).map((movie) => (
                <MovieCard key={movie.id} movie={movie} variant="spotlight" />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="row-section__header mb-6">
            <h2 className="row-section__title">All results</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {query.sort === "rating" ? "Sorted by TMDB rating" : query.sort === "release_date" ? "Sorted by release date" : query.sort === "title" ? "Sorted by title" : "Sorted by TMDB popularity"}
            </p>
          </div>
          <MovieGrid movies={discovered.results} />
          <div className="mt-10 flex justify-center gap-4 text-sm">
            {query.page > 1 && <a href={`?page=${query.page - 1}`} className="btn btn-ghost">Previous</a>}
            {query.page < discovered.totalPages && <a href={`?page=${query.page + 1}`} className="btn btn-secondary">Load more</a>}
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof TmdbUnavailableError) return <PageError />;
    return <PageError message="Those filters could not be applied." />;
  }
}
