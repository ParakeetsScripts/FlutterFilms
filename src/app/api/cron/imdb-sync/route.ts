import { verifyCron } from "@/lib/sync/cron-auth";
import { runImdbSync } from "@/lib/sync/imdb-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = verifyCron(request);
  if (denied) return denied;
  const result = await runImdbSync();
  return NextResponse.json(result);
}
