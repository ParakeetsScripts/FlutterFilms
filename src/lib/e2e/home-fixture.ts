import type { HomeData } from "@/lib/home";
import type { MovieSummary } from "@/lib/tmdb/types";

const SAMPLE: MovieSummary = {
  id: 550,
  tmdbId: 550,
  title: "Fight Club",
  originalTitle: "Fight Club",
  overview: "An insomniac office worker forms an underground fight club.",
  releaseDate: "1999-10-15",
  year: 1999,
  posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3aJJl.jpg",
  backdropPath: "/52AvXazXsP6WzBtaJhO0l9afJqH.jpg",
  voteAverage: 8.4,
  voteCount: 28000,
  popularity: 120,
  genres: [{ id: 18, name: "Drama" }],
  originalLanguage: "en",
  adult: false,
  source: "tmdb",
  sourceVersion: "e2e",
  retrievedAt: new Date(0).toISOString(),
};

function row(id: number, title: string, year: number): MovieSummary {
  return {
    ...SAMPLE,
    id,
    tmdbId: id,
    title,
    originalTitle: title,
    year,
    releaseDate: `${year}-01-01`,
  };
}

/** Deterministic homepage payload for Playwright when TMDB is unavailable. */
export function buildE2EHomeData(): HomeData {
  const movies = [
    row(550, "Fight Club", 1999),
    row(27205, "Inception", 2010),
    row(157336, "Interstellar", 2014),
    row(603, "The Matrix", 1999),
    row(13, "Forrest Gump", 1994),
    row(680, "Pulp Fiction", 1994),
  ];

  return {
    featured: movies[0],
    featuredLabel: "Trending Now",
    heroCandidates: movies,
    sections: [
      { id: "trending", title: "Trending Now", movies, href: "/movies", spotlight: true },
      { id: "popular", title: "Popular", movies, href: "/movies?sort=popularity" },
      { id: "top-rated", title: "Top Rated", movies, href: "/movies?sort=rating" },
    ],
  };
}
