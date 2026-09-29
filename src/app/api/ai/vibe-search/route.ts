import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { vibeSearch } from "@/lib/ai/intelligence/vibe-search";

export async function POST(request: Request) {
  rateLimit(`ai-vibe:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const body = (await request.json()) as {
      query?: string;
      favorites?: number[];
      watchlist?: number[];
      history?: number[];
      favoriteGenres?: number[];
    };
    if (!body.query?.trim()) throw new Error("Query required.");
    return vibeSearch(body.query, {
      favoriteMovieIds: body.favorites,
      watchlistIds: body.watchlist,
      historyIds: body.history,
      favoriteGenreIds: body.favoriteGenres,
    });
  });
}
