import { exchangeGoogleCode } from "@/lib/auth/google";
import { findOrCreateOAuthUser } from "@/lib/auth/repository";
import { createSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expected = store.get("ff_oauth_state")?.value;

  if (!code || !state || state !== expected) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  const profile = await exchangeGoogleCode(code, `${url.origin}/api/auth/google/callback`);
  const userId = await findOrCreateOAuthUser({
    provider: "google",
    providerAccountId: profile.sub,
    email: profile.email,
    displayName: profile.name,
    avatarUrl: profile.picture,
  });

  await createSession(userId);
  store.delete("ff_oauth_state");
  return NextResponse.redirect(new URL("/account/import", request.url));
}
