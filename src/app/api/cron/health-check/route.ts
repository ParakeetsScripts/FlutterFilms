import { verifyCron } from "@/lib/sync/cron-auth";
import { getSourceHealth, getRecentSyncJobs } from "@/lib/sync/repository";
import { classifyFreshness } from "@/lib/sync/freshness";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = verifyCron(request);
  if (denied) return denied;
  const health = (await getSourceHealth()).map((row) => ({
    ...row,
    freshness: classifyFreshness(row.lastSuccessfulSync, row.source === "imdb" ? "imdb" : "tmdb"),
  }));
  return NextResponse.json({ health, recentJobs: await getRecentSyncJobs(5) });
}
