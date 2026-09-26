import { getRecentSyncJobs, getSourceHealth } from "@/lib/sync/repository";
import { classifyFreshness, formatRelativeTime } from "@/lib/sync/freshness";
import { NextResponse } from "next/server";

export async function GET() {
  const health = (await getSourceHealth()).map((row) => ({
    ...row,
    freshness: classifyFreshness(row.lastSuccessfulSync, row.source === "imdb" ? "imdb" : "tmdb"),
    lastSuccessfulRelative: formatRelativeTime(row.lastSuccessfulSync),
  }));
  return NextResponse.json({
    health,
    jobs: await getRecentSyncJobs(20),
  });
}
