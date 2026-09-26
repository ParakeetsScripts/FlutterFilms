import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { recordAnalyticsEvent } from "@/lib/analytics/repository";
import { requireSessionUser } from "@/lib/auth/session";
import { groupPick } from "@/lib/ai/intelligence/social";
import {
  addRoomCandidate,
  closeRoom,
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  lockRoomChoice,
  restartRoomVoting,
  saveRoomPreferences,
  setRoomResult,
  voteInRoom,
  removeVote,
  type SpoilerLevel,
} from "@/lib/social/rooms";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  return handleApi(async () => {
    if (!code) throw new Error("Room code required.");
    const room = await getRoomByCode(code);
    if (!room) throw new Error("Room not found or expired.");
    return { room, updatedAt: new Date().toISOString() };
  });
}

export async function POST(request: Request) {
  rateLimit(`rooms:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const body = (await request.json()) as {
      action?: string;
      title?: string;
      code?: string;
      preferences?: Record<string, unknown>;
      guestName?: string;
      movieId?: number;
      spoilerLevel?: SpoilerLevel;
      participantId?: string;
    };

    if (body.action === "create") {
      const user = await requireSessionUser();
      const room = await createRoom(user.id, body.title ?? "Movie night", body.spoilerLevel ?? "none");
      await recordAnalyticsEvent({ name: "room_created", userId: user.id, properties: { shareCode: room.shareCode } });
      return room;
    }

    if (!body.code) throw new Error("Room code required.");
    const room = await getRoomByCode(body.code);
    if (!room) throw new Error("Room not found or expired.");

    const user = await getOptionalUser();

    if (body.action === "join") {
      const joined = await joinRoom(room.id, user?.id ?? null, body.guestName ?? null, body.preferences ?? {});
      await recordAnalyticsEvent({
        name: "room_joined",
        userId: user?.id,
        properties: { code: body.code, guest: !user },
      });
      return { room: await getRoomByCode(body.code), participantId: joined.participantId };
    }

    if (body.action === "leave" && user) {
      await leaveRoom(room.id, user.id);
      await recordAnalyticsEvent({ name: "room_left", userId: user.id, properties: { code: body.code } });
      return { ok: true };
    }

    if (body.action === "preferences" && user) {
      await saveRoomPreferences(room.id, user.id, body.preferences ?? {});
      await recordAnalyticsEvent({ name: "room_preference_saved", userId: user.id, properties: { code: body.code } });
      return { ok: true };
    }

    if (body.action === "add_candidate" && body.movieId) {
      const actorId = user?.id ?? body.participantId;
      if (!actorId) throw new Error("Sign in or join as guest first.");
      await addRoomCandidate(room.id, actorId, body.movieId);
      await recordAnalyticsEvent({ name: "room_movie_viewed", userId: user?.id, properties: { code: body.code, movieId: body.movieId } });
      return { room: await getRoomByCode(body.code) };
    }

    const voterId = user?.id ?? body.participantId ?? `guest:${body.guestName ?? "anonymous"}`;

    if (body.action === "vote" && body.movieId) {
      await voteInRoom(room.id, voterId, body.movieId);
      await recordAnalyticsEvent({ name: "room_vote_created", userId: user?.id, properties: { code: body.code, movieId: body.movieId } });
      return { room: await getRoomByCode(body.code) };
    }

    if (body.action === "unvote" && body.movieId) {
      await removeVote(room.id, voterId, body.movieId);
      await recordAnalyticsEvent({ name: "room_vote_removed", userId: user?.id, properties: { code: body.code, movieId: body.movieId } });
      return { room: await getRoomByCode(body.code) };
    }

    if (body.action === "pick") {
      const profiles = room.participants.map((p, i) => {
        const prefs = JSON.parse(p.preferences_json || "{}") as {
          favoriteMovies?: number[];
          label?: string;
          mood?: string;
          genres?: string[];
          dealBreakers?: string[];
        };
        return {
          label: prefs.label ?? p.guest_name ?? `Guest ${i + 1}`,
          movieIds: prefs.favoriteMovies ?? [],
          mood: prefs.mood,
          genres: prefs.genres,
          dealBreakers: prefs.dealBreakers,
        };
      });
      const candidateIds = room.candidates.map((c) => c.movie_id);
      const result = await groupPick(
        profiles.map((p) => ({ label: p.label, movieIds: p.movieIds })),
        candidateIds,
      );
      await setRoomResult(room.id, {
        pick: result.pick,
        alternates: result.alternates,
        sharedGenres: result.sharedGenres,
        overlaps: result.overlaps,
        compromises: result.compromises,
        reason: result.reason,
      });
      await recordAnalyticsEvent({ name: "room_result_generated", userId: user?.id, properties: { code: body.code } });
      return { ...result, room: await getRoomByCode(body.code) };
    }

    if (body.action === "lock" && body.movieId && user) {
      await lockRoomChoice(room.id, user.id, body.movieId);
      return { room: await getRoomByCode(body.code) };
    }

    if (body.action === "restart" && user) {
      await restartRoomVoting(room.id, user.id);
      return { room: await getRoomByCode(body.code) };
    }

    if (body.action === "close" && user) {
      await closeRoom(room.id, user.id);
      await recordAnalyticsEvent({ name: "room_closed", userId: user.id, properties: { code: body.code } });
      return { closed: true };
    }

    throw new Error("Invalid room action.");
  });
}

async function getOptionalUser() {
  try {
    return await requireSessionUser();
  } catch {
    return null;
  }
}
