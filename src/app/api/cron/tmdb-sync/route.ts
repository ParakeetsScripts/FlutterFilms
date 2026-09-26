import { verifyCron } from "@/lib/sync/cron-auth";
import { runTmdbSync } from "@/lib/sync/tmdb-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = verifyCron(request);
  if (denied) return denied;
  const result = await runTmdbSync({ discovery: true, changes: true });
  return NextResponse.json(result);
}
