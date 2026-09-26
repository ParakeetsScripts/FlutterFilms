import { clientKey, handleApi, rateLimit } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { getOnboardingState, saveOnboardingDraft } from "@/lib/onboarding/repository";
import { sanitizeOnboardingPayload } from "@/lib/onboarding/validate";
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

export async function GET() {
  return handleApi(async () => {
    const { userId, authenticated } = await resolveUserId();
    const state = await getOnboardingState(userId);
    return { state, authenticated };
  });
}

export async function POST(request: Request) {
  rateLimit(`onboarding-state:${clientKey(request)}`, 40);
  return handleApi(async () => {
    const { userId, authenticated } = await resolveUserId();
    const body = await request.json();
    const state = sanitizeOnboardingPayload(body.state ?? body);
    if (!state) return { error: "Invalid onboarding state." };
    await saveOnboardingDraft(userId, state);
    return { state, authenticated, saved: true };
  });
}
