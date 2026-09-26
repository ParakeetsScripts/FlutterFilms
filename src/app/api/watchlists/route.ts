import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { recordAnalyticsEvent } from "@/lib/analytics/repository";
import { requireSessionUser } from "@/lib/auth/session";
import { runWatchlistAi, type WatchlistAiAction } from "@/lib/social/watchlist-ai";
import {
  addToSharedWatchlist,
  createSharedWatchlist,
  deleteSharedWatchlist,
  getSharedWatchlist,
  inviteToWatchlist,
  leaveSharedWatchlist,
  listUserSharedWatchlists,
  removeFromSharedWatchlist,
  removeMember,
  renameSharedWatchlist,
  reorderSharedWatchlist,
  updateMemberRole,
  type WatchlistRole,
} from "@/lib/social/watchlists";

export async function GET() {
  return handleApi(async () => {
    const user = await requireSessionUser();
    const lists = await listUserSharedWatchlists(user.id);
    return { watchlists: lists };
  });
}

export async function POST(request: Request) {
  rateLimit(`watchlists:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const user = await requireSessionUser();
    const body = (await request.json()) as {
      action?: string;
      watchlistId?: string;
      title?: string;
      movieId?: number;
      movieIds?: number[];
      email?: string;
      role?: WatchlistRole;
      memberId?: string;
      aiAction?: WatchlistAiAction;
      userTasteIds?: number[];
    };

    if (body.action === "create") {
      const list = await createSharedWatchlist(user.id, body.title ?? "Shared watchlist");
      await recordAnalyticsEvent({ name: "shared_list_created", userId: user.id, properties: { watchlistId: list.id } });
      return list;
    }

    if (body.action === "get" && body.watchlistId) {
      const list = await getSharedWatchlist(body.watchlistId, user.id);
      if (!list) throw new Error("Watchlist not found or access denied.");
      return list;
    }

    if (body.action === "rename" && body.watchlistId && body.title) {
      await renameSharedWatchlist(body.watchlistId, user.id, body.title);
      return { ok: true };
    }

    if (body.action === "delete" && body.watchlistId) {
      await deleteSharedWatchlist(body.watchlistId, user.id);
      return { ok: true };
    }

    if (body.action === "leave" && body.watchlistId) {
      await leaveSharedWatchlist(body.watchlistId, user.id);
      return { ok: true };
    }

    if (body.action === "invite" && body.watchlistId && body.email) {
      await inviteToWatchlist(body.watchlistId, user.id, body.email, body.role ?? "editor");
      await recordAnalyticsEvent({ name: "shared_list_invited", userId: user.id, properties: { watchlistId: body.watchlistId } });
      return { ok: true };
    }

    if (body.action === "update_role" && body.watchlistId && body.memberId && body.role) {
      await updateMemberRole(body.watchlistId, user.id, body.memberId, body.role);
      return { ok: true };
    }

    if (body.action === "remove_member" && body.watchlistId && body.memberId) {
      await removeMember(body.watchlistId, user.id, body.memberId);
      return { ok: true };
    }

    if (body.action === "add" && body.watchlistId && body.movieId) {
      await addToSharedWatchlist(body.watchlistId, user.id, body.movieId);
      await recordAnalyticsEvent({ name: "shared_list_movie_added", userId: user.id, properties: { watchlistId: body.watchlistId, movieId: body.movieId } });
      return { ok: true };
    }

    if (body.action === "remove" && body.watchlistId && body.movieId) {
      await removeFromSharedWatchlist(body.watchlistId, user.id, body.movieId);
      await recordAnalyticsEvent({ name: "shared_list_movie_removed", userId: user.id, properties: { watchlistId: body.watchlistId, movieId: body.movieId } });
      return { ok: true };
    }

    if (body.action === "reorder" && body.watchlistId && body.movieIds) {
      await reorderSharedWatchlist(body.watchlistId, user.id, body.movieIds);
      return { ok: true };
    }

    if (body.action === "ai" && body.watchlistId && body.aiAction) {
      const list = await getSharedWatchlist(body.watchlistId, user.id);
      if (!list) throw new Error("Watchlist not found.");
      const ids = list.items.map((i) => i.movie_id);
      const result = await runWatchlistAi(body.aiAction, ids, body.userTasteIds ?? []);
      await recordAnalyticsEvent({
        name: "shared_list_ai_used",
        userId: user.id,
        properties: { watchlistId: body.watchlistId, action: body.aiAction },
      });
      return result;
    }

    throw new Error("Invalid watchlist action.");
  });
}
