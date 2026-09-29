import { handleApi } from "@/lib/api";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { buildMoviesDiscoverQuery } from "@/lib/discover/query";
import { discoverMovies } from "@/lib/tmdb/discover";

/** Load-more for Discover: accepts the same params as /movies and reuses its query builder. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return handleApi(async () => {
    const catalog = await getServerCatalogPreferences();
    return discoverMovies(buildMoviesDiscoverQuery(params, catalog));
  });
}
