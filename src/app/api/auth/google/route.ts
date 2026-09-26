import { getGoogleAuthUrl } from "@/lib/auth/google";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  }
  const origin = new URL(request.url).origin;
  const state = randomBytes(16).toString("base64url");
  const response = NextResponse.redirect(getGoogleAuthUrl(`${origin}/api/auth/google/callback`, state));
  response.cookies.set("ff_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
