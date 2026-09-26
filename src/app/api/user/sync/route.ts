import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { ensureUser } from "@/lib/user/repository";
import { getUserLibrary, saveUserLibrary } from "@/lib/user/library-repository";
import { mergeLibraries } from "@/lib/user/merge";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

async function deviceId() {
  const store = await cookies();
  const existing = store.get("ff_device_id")?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set("ff_device_id", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return id;
}

export async function GET() {
  return handleApi(async () => {
    const session = await getSessionUser();
    const userId = session?.id ?? (await ensureUser(await deviceId()));
    const library = await getUserLibrary(userId);
    return { userId, authenticated: Boolean(session), library };
  });
}

export async function POST(request: Request) {
  rateLimit(`user-sync:${clientKey(request)}`, 30);
  return handleApi(async () => {
    const session = await getSessionUser();
    const userId = session?.id ?? (await ensureUser(await deviceId()));
    const body = (await request.json()) as {
      watchlist?: number[];
      favorites?: number[];
      history?: Array<{ movieId: number; viewedAt: string }>;
      continueWatching?: Array<{
        movieId: number;
        positionSeconds: number;
        durationSeconds: number;
        kind: string;
        updatedAt: string;
      }>;
      settings?: Record<string, unknown>;
      mergeMode?: "all" | "selective" | "skip";
      mergeSelection?: Partial<Record<"watchlist" | "favorites" | "history" | "continue" | "settings", boolean>>;
    };

    const current = await getUserLibrary(userId);
    const merged = mergeLibraries(
      current,
      {
        watchlist: body.watchlist,
        favorites: body.favorites,
        history: body.history,
        continueWatching: body.continueWatching,
        settings: body.settings,
      },
      body.mergeMode ?? "all",
      body.mergeSelection,
    );

    await saveUserLibrary(userId, merged);
    return { userId, authenticated: Boolean(session), library: merged };
  });
}
