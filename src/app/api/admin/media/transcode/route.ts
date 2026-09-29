import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { pollMediaConvertQueue, processTranscodeQueue } from "@/lib/media/transcode";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const limit = Number(body?.limit) || 5;
  const [ffmpegProcessed, mediaConvertPolled] = await Promise.all([
    processTranscodeQueue(limit),
    pollMediaConvertQueue(limit),
  ]);
  return NextResponse.json({ processed: ffmpegProcessed, mediaConvertPolled });
}
