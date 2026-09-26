import { clientKey, handleApi, rateLimit } from "@/lib/api";
import { searchMovies, searchPeople } from "@/lib/tmdb/search";
import { parseQuery } from "@/lib/validation";
import type { MovieSummary } from "@/lib/tmdb/types";

function toMovieItem(movie: MovieSummary) {
  return {
    id: movie.id,
    tmdbId: movie.tmdbId ?? movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle,
    year: movie.year,
    posterPath: movie.posterPath,
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = parseQuery(params.get("q") ?? params.get("query"));
  const type = params.get("type") ?? "movie";
  rateLimit(`onboarding-search:${clientKey(request)}`, 60);

  return handleApi(async () => {
    if (query.length < 2) {
      return { query, movies: [], people: [], message: "Type at least 2 characters." };
    }

    if (type === "person") {
      const people = await searchPeople(query, 1);
      return {
        query,
        movies: [],
        people: (people.results ?? []).slice(0, 12).map((p) => ({
          id: p.id,
          name: p.name,
          profilePath: p.profile_path,
          knownFor: null,
          department: p.known_for_department ?? null,
        })),
      };
    }

    const movies = await searchMovies(query, 1);
    return {
      query,
      movies: movies.results.slice(0, 12).map(toMovieItem),
      people: [],
    };
  });
}
