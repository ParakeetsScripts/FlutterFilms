import "server-only";

import { runFeature } from "../features/runtime";
import { searchCatalog } from "@/lib/sync/catalog";
import { getMovie } from "@/lib/tmdb/movies";
import { tmdbFetch } from "@/lib/tmdb/client";
import { getMovieCollection } from "@/lib/tmdb/movies";
import { runRecommendation } from "../intelligence/recommendations";
import { vibeSearch } from "../intelligence/vibe-search";
import { semanticSearch } from "../intelligence/semantic-search";
import { computeTasteDna } from "../intelligence/taste";
import { buildCreativeAsset } from "../intelligence/creative";
import { buildWeeklyBrief } from "../intelligence/weekly-brief";
import { getWatchProviders } from "@/lib/tmdb/watch-providers";
import { getIntelligenceFeature } from "../features/registry";
import { recordRecommendationFeedback } from "../recommendations-repository";
import { addMovieToWatchlist, removeMovieFromWatchlist } from "@/lib/user/watchlist-mutations";
import { getRoomByCode } from "@/lib/social/rooms";

export type AgentToolContext = {
  userId?: string | null;
  watchlist?: number[];
  favorites?: number[];
  history?: number[];
};

export const AGENT_TOOLS = [
  "searchMovies",
  "getMovie",
  "getPerson",
  "getCollection",
  "recommendMovies",
  "searchByVibe",
  "getTasteDNA",
  "getWatchHistory",
  "getWatchlist",
  "getFavorites",
  "createWatchlistEntry",
  "removeWatchlistEntry",
  "createRecommendationFeedback",
  "buildMarathon",
  "buildDoubleFeature",
  "findWhereToWatch",
  "getFranchise",
  "getFeature",
  "searchSemanticCatalog",
  "generateImage",
  "generateVideo",
  "createMovieNight",
  "createNewsletter",
  "getCommunityRoom",
] as const;

export type AgentToolName = (typeof AGENT_TOOLS)[number];

export async function invokeAgentTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  ctx: AgentToolContext,
) {
  const watchlist = ctx.watchlist ?? [];
  const favorites = ctx.favorites ?? [];
  const history = ctx.history ?? [];

  switch (name) {
    case "searchMovies": {
      const q = String(args.query ?? "");
      const page = Number(args.page ?? 1);
      return searchCatalog(q, page);
    }
    case "getMovie":
      return getMovie(Number(args.movieId));
    case "getPerson":
      return tmdbFetch(`/person/${Number(args.personId)}`, { append_to_response: "movie_credits" });
    case "getCollection":
    case "getFranchise":
      return getMovieCollection(Number(args.collectionId));
    case "recommendMovies":
      return runRecommendation({
        mode: (args.mode as import("../intelligence/recommendations").RecommendMode) ?? "instant",
        watchlist,
        favorites,
        history,
        maxRuntime: args.maxRuntime ? Number(args.maxRuntime) : undefined,
      });
    case "searchByVibe":
      return vibeSearch(String(args.query ?? ""));
    case "searchSemanticCatalog":
      return semanticSearch(
        String(args.query ?? ""),
        (args.kind as "scene" | "visual" | "structure" | "pacing" | "arc" | "relationship" | "general") ?? "general",
      );
    case "getFeature": {
      const slug = String(args.slug ?? args.featureId ?? "");
      const feature = getIntelligenceFeature(slug);
      return feature ?? { error: "Feature not found." };
    }
    case "findWhereToWatch": {
      const movieId = Number(args.movieId);
      if (!movieId) return { error: "movieId required" };
      const providers = await getWatchProviders(movieId, String(args.region ?? "US"));
      return { movieId, providers, labels: ["TMDB watch providers"] };
    }
    case "getTasteDNA":
      return computeTasteDna((args.movieIds as number[]) ?? [...favorites, ...history]);
    case "getWatchHistory":
      return { history };
    case "getWatchlist":
      return { watchlist };
    case "getFavorites":
      return { favorites };
    case "buildMarathon":
      return runFeature("weekend-marathon", {}, { ...ctx, skipTelemetry: true });
    case "buildDoubleFeature":
      return runFeature("double-feature", {}, { ...ctx, skipTelemetry: true });
    case "createNewsletter":
      return buildWeeklyBrief();
    case "generateImage":
      return buildCreativeAsset("poster", {
        title: String(args.title ?? "Movie Night"),
        subtitle: args.subtitle ? String(args.subtitle) : undefined,
      });
    case "generateVideo":
      return {
        status: "unavailable",
        message: "Video generation requires a configured provider. No fake output is returned.",
      };
    case "createMovieNight":
      return buildCreativeAsset("movie_night_card", {
        title: String(args.title ?? "Movie Night"),
        movies: (args.movies as Array<{ title: string; year?: number | null }>) ?? [],
      });
    case "createWatchlistEntry": {
      if (!ctx.userId) return { status: "unavailable", message: "Sign in to modify your watchlist." };
      const movieId = Number(args.movieId);
      if (!movieId) return { error: "movieId required" };
      const result = await addMovieToWatchlist(ctx.userId, movieId);
      return { ...result, status: result.added ? "success" : "unchanged" };
    }
    case "removeWatchlistEntry": {
      if (!ctx.userId) return { status: "unavailable", message: "Sign in to modify your watchlist." };
      const movieId = Number(args.movieId);
      if (!movieId) return { error: "movieId required" };
      const result = await removeMovieFromWatchlist(ctx.userId, movieId);
      return { ...result, status: result.removed ? "success" : "unchanged" };
    }
    case "createRecommendationFeedback": {
      if (!ctx.userId) return { status: "unavailable", message: "Sign in to save recommendation feedback." };
      const movieId = Number(args.movieId);
      const feedback = String(args.feedback ?? "more_like_this") as import("../recommendations-repository").RecommendationFeedback;
      if (!movieId) return { error: "movieId required" };
      await recordRecommendationFeedback({ userId: ctx.userId, movieId, feedback, eventId: args.eventId ? String(args.eventId) : undefined });
      return { status: "success", movieId, feedback };
    }
    case "getCommunityRoom": {
      const code = String(args.code ?? args.roomCode ?? "");
      if (!code) return { error: "room code required" };
      const room = await getRoomByCode(code);
      return room ?? { status: "unavailable", message: "Room not found." };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
