import { clientKey, handleApi, rateLimit } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { applyOnboardingToUser } from "@/lib/onboarding/apply";
import { getOnboardingState, saveOnboardingDraft } from "@/lib/onboarding/repository";
import { sanitizeOnboardingPayload, validateOnboardingComplete } from "@/lib/onboarding/validate";
import { ONBOARDING_VERSION } from "@/lib/onboarding/types";
import { ensureUser } from "@/lib/user/repository";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

async function resolveUserId() {
  const session = await getSessionUser();
  if (session) return { userId: session.id, authenticated: true };
  const store = await cookies();
  let deviceId = store.get("ff_device_id")?.value;
  if (!deviceId) {
    deviceId = randomUUID();
    store.set("ff_device_id", deviceId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return { userId: await ensureUser(deviceId), authenticated: false };
}

export async function POST(request: Request) {
  rateLimit(`onboarding-complete:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const { userId, authenticated } = await resolveUserId();
    const body = await request.json();
    const incoming = sanitizeOnboardingPayload(body.state ?? body);
    if (!incoming) return { error: "Invalid onboarding payload." };

    const existing = await getOnboardingState(userId);
    const hasExistingTaste =
      existing.completed ||
      existing.favoriteMovies.length > 0 ||
      (body.mergeMode !== "replace" && existing.favoriteGenres.length > 0);

    const state = body.mergeMode === "replace" || !hasExistingTaste
      ? incoming
      : {
          ...existing,
          favoriteMovies: [...existing.favoriteMovies, ...incoming.favoriteMovies].filter(
            (m, i, arr) => arr.findIndex((x) => x.tmdbId === m.tmdbId) === i,
          ),
          favoriteGenres: [...new Set([...existing.favoriteGenres, ...incoming.favoriteGenres])],
          favoritePeople: [...existing.favoritePeople, ...incoming.favoritePeople].filter(
            (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
          ),
          preferredLanguages: [...new Set([...existing.preferredLanguages, ...incoming.preferredLanguages])],
          discoveryPreferences: incoming.discoveryPreferences,
          step: incoming.step,
        };

    const validationError = validateOnboardingComplete(state);
    if (validationError) return { error: validationError };

    state.completed = true;
    state.completedAt = new Date().toISOString();
    state.version = ONBOARDING_VERSION;

    await applyOnboardingToUser(userId, state);
    await saveOnboardingDraft(userId, state);

    return {
      success: true,
      authenticated,
      state,
      summary: {
        movies: state.favoriteMovies.length,
        genres: state.favoriteGenres.length,
        people: state.favoritePeople.length,
        languages: state.preferredLanguages.length,
      },
    };
  }, { route: "/api/onboarding/complete" });
}
