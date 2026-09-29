import { DiscoverCatalog, type DiscoverCatalogProps } from "@/components/discover/DiscoverCatalog";
import { PageError } from "@/components/ui/States";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { catalogQueryKey } from "@/lib/discover/catalog-view";
import { hasActiveMovieFilters } from "@/lib/discover/filters";
import { buildMoviesDiscoverQuery, type MoviesPageParams } from "@/lib/discover/query";
import { findCountry, LANGUAGES } from "@/lib/regions";
import { discoverMovies } from "@/lib/tmdb/discover";
import { getTrendingMovies } from "@/lib/tmdb/movies";
import { TmdbUnavailableError } from "@/lib/tmdb/client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse TMDB's global movie catalog as a spatial archive — filter, sort, inspect, and open any film.",
};

const SORT_DESCRIPTIONS: Record<string, string> = {
  popularity: "TMDB popularity",
  rating: "TMDB rating",
  release_date: "release date",
  title: "title",
};

async function loadCatalog(params: MoviesPageParams): Promise<DiscoverCatalogProps> {
  const catalog = await getServerCatalogPreferences();
  const query = buildMoviesDiscoverQuery(params, catalog);
  const [trending, discovered] = await Promise.all([
    getTrendingMovies("day", 1, { language: catalog.uiLanguage, region: catalog.region }).catch(() => ({ results: [] })),
    discoverMovies(query),
  ]);
  const languageLabel = query.originalLanguage
    ? (LANGUAGES.find((l) => l.code === query.originalLanguage)?.name ?? query.originalLanguage)
    : null;
  const countryLabel = query.originCountry ? findCountry(query.originCountry)?.name : null;

  return {
    queryKey: catalogQueryKey(params),
    searchParams: Object.fromEntries(
      Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""),
    ),
    title: languageLabel ? `${languageLabel} cinema` : "Discover",
    sortLabel: SORT_DESCRIPTIONS[query.sort ?? "popularity"] ?? "TMDB popularity",
    filtersActive: hasActiveMovieFilters(params),
    contextNotes: [
      countryLabel ? `Production country: ${countryLabel}` : null,
      languageLabel ? `Original language: ${languageLabel}` : null,
    ].filter((note): note is string => Boolean(note)),
    initial: {
      page: query.page,
      totalPages: discovered.totalPages,
      totalResults: discovered.totalResults,
      results: discovered.results,
    },
    trending: trending.results,
  };
}

export default async function MoviesPage({ searchParams }: { searchParams: Promise<MoviesPageParams> }) {
  const params = await searchParams;
  let props: DiscoverCatalogProps | null = null;
  let tmdbDown = false;
  try {
    props = await loadCatalog(params);
  } catch (error) {
    tmdbDown = error instanceof TmdbUnavailableError;
  }

  if (!props) {
    return tmdbDown ? <PageError /> : <PageError message="Those filters could not be applied." />;
  }
  return <DiscoverCatalog key={`${props.queryKey}|${props.initial.page}`} {...props} />;
}
