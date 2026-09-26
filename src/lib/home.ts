import { getLatestSections } from "@/lib/sync/catalog";
import { discoverMovies } from "@/lib/tmdb/discover";
import {
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from "@/lib/tmdb/movies";
import type { MovieSummary } from "@/lib/tmdb/types";
import { buildE2EHomeData } from "@/lib/e2e/home-fixture";
import { FEATURED_GENRES } from "@/lib/regions";

const ROW_LIMIT = 14;

export type HomeSection = {
  id: string;
  title: string;
  movies: MovieSummary[];
  href?: string;
  spotlight?: boolean;
  showUpdated?: boolean;
  upcoming?: boolean;
  empty?: string;
};

export type HomeData = {
  featured: MovieSummary;
  featuredLabel: string;
  heroCandidates: MovieSummary[];
  sections: HomeSection[];
};

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  const result = await Promise.allSettled([promise]);
  return result[0].status === "fulfilled" ? result[0].value : null;
}

function trimRow(movies: MovieSummary[], limit = ROW_LIMIT): MovieSummary[] {
  return movies.slice(0, limit);
}

function sortByReleaseDate(movies: MovieSummary[]): MovieSummary[] {
  return [...movies].sort((a, b) => {
    const aDate = a.releaseDate ?? "";
    const bDate = b.releaseDate ?? "";
    return bDate.localeCompare(aDate);
  });
}

export async function loadHomeData(language?: string): Promise<HomeData> {
  try {
    return await loadHomeDataFromSources(language);
  } catch (error) {
    if (process.env.PLAYWRIGHT === "1") {
      return buildE2EHomeData();
    }
    throw error;
  }
}

async function loadHomeDataFromSources(language?: string): Promise<HomeData> {
  const [trending, popular, nowPlaying, upcoming, topRated, latest, genreSpotlight] = await Promise.all([
    settled(getTrendingMovies("day")),
    settled(getPopularMovies()),
    settled(getNowPlayingMovies()),
    settled(getUpcomingMovies()),
    settled(getTopRatedMovies()),
    settled(getLatestSections()),
    settled(discoverMovies({ genre: FEATURED_GENRES[0].id, sort: "popularity", language })),
  ]);

  const trendingMovies = trimRow(trending?.results ?? []);
  const featured = trendingMovies[0] ?? popular?.results?.[0];
  if (!featured) {
    throw new Error("No movies available");
  }

  const sections: HomeSection[] = [
    {
      id: "trending",
      title: "Trending Now",
      movies: trendingMovies,
      href: "/movies",
      spotlight: true,
      empty: "Trending is temporarily unavailable.",
    },
    {
      id: "popular",
      title: "Popular",
      movies: trimRow(popular?.results ?? []),
      href: "/movies?sort=popularity",
      empty: "Popular titles are temporarily unavailable.",
    },
    {
      id: "new-releases",
      title: "New Releases",
      movies: trimRow(sortByReleaseDate(nowPlaying?.results ?? [])),
      href: "/latest",
      empty: "New releases are temporarily unavailable.",
    },
    {
      id: "upcoming",
      title: "Coming Soon",
      movies: trimRow(upcoming?.results ?? []),
      href: "/latest",
      upcoming: true,
      empty: "Upcoming titles are temporarily unavailable.",
    },
    {
      id: "top-rated",
      title: "Top Rated",
      movies: trimRow(topRated?.results ?? []),
      href: "/movies?sort=rating",
      empty: "Top rated titles are temporarily unavailable.",
    },
    {
      id: "genres",
      title: "Because you like Action",
      movies: trimRow(genreSpotlight?.results ?? trendingMovies),
      href: "/genres",
      empty: "Genre picks are temporarily unavailable.",
    },
    {
      id: "recently-updated",
      title: "Recently Updated",
      movies: trimRow(latest?.updated ?? []),
      href: "/latest",
      showUpdated: true,
      empty: "No recent metadata updates yet.",
    },
  ];

  const heroCandidates = [
    ...trendingMovies.slice(0, 5),
    ...trimRow(popular?.results ?? [], 3),
  ].filter((movie, index, list) => list.findIndex((item) => item.id === movie.id) === index);

  return {
    featured,
    featuredLabel: "Trending Now",
    heroCandidates,
    sections,
  };
}

/** @deprecated Use loadHomeData */
export async function loadHomeRows(language?: string) {
  const data = await loadHomeData(language);
  return data.sections.map((section) => ({
    title: section.title,
    movies: section.movies,
  }));
}
