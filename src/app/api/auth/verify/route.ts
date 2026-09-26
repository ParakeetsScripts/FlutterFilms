import { consumeAuthToken } from "@/lib/auth/tokens";
import { markEmailVerified } from "@/lib/auth/repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const userId = await consumeAuthToken(token, "email_verify");
  if (!userId) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

  await markEmailVerified(userId);
  return NextResponse.redirect(new URL("/account?verified=1", request.url));
}
