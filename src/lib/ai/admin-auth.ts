import "server-only";

import { NextResponse } from "next/server";

export function verifyAiAdmin(request: Request): NextResponse | null {
  const secret = process.env.AI_ADMIN_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "AI_ADMIN_SECRET not configured" }, { status: 503 });
    }
    return null;
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
