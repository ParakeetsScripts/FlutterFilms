import { handleApi } from "@/lib/api";
import { filterLowerNoise, lowerNoiseQuery } from "@/lib/home/chapters";
import { discoverMovies } from "@/lib/tmdb/discover";
import { getPopularMovies, getTrendingMovies } from "@/lib/tmdb/movies";
import { parsePage } from "@/lib/validation";

/** Next page of homepage "Hidden gems", using the same lower-noise rule and mainstream exclusion. */
export async function GET(request: Request) {
  const page = parsePage(new URL(request.url).searchParams.get("page"));
  return handleApi(async () => {
    const [discovered, trending, popular] = await Promise.all([
      discoverMovies(lowerNoiseQuery(page, new Date())),
      getTrendingMovies("day").catch(() => ({ results: [] })),
      getPopularMovies(1).catch(() => ({ results: [] })),
    ]);
    const mainstream = new Set([...trending.results, ...popular.results].map((movie) => movie.id));
    return {
      page: discovered.page,
      totalPages: discovered.totalPages,
      results: filterLowerNoise(discovered.results, mainstream),
    };
  });
}
