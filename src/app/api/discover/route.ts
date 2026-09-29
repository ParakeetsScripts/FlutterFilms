import { handleApi } from "@/lib/api";
import { discoverMovies } from "@/lib/tmdb/discover";
import {
  parseGenreId,
  parseLanguage,
  parsePage,
  parseRating,
  parseRegion,
  parseSort,
  parseYear,
} from "@/lib/validation";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return handleApi(() =>
    discoverMovies({
      page: parsePage(params.get("page")),
      genre: parseGenreId(params.get("genre")),
      year: parseYear(params.get("year")),
      yearGte: parseYear(params.get("yearGte")),
      yearLte: parseYear(params.get("yearLte")),
      ratingGte: parseRating(params.get("ratingGte")),
      ratingLte: parseRating(params.get("ratingLte")),
      uiLanguage: parseLanguage(params.get("uiLanguage")) ?? parseLanguage(params.get("language")),
      originalLanguage: parseLanguage(params.get("originalLanguage")) ?? parseLanguage(params.get("language")),
      region: parseRegion(params.get("region")),
      sort: parseSort(params.get("sort")),
    }),
  );
}
