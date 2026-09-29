import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { describeMediaInfrastructure } from "@/lib/media/playback";
import { listLiveChannels } from "@/lib/media/live-repository";
import { ffmpegAvailable } from "@/lib/media/transcode";
import { listMediaAssets, listTranscodeJobs } from "@/lib/media/repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const [assets, jobs, channels, hasFfmpeg] = await Promise.all([
    listMediaAssets(100),
    listTranscodeJobs(50),
    listLiveChannels(50),
    ffmpegAvailable(),
  ]);

  return NextResponse.json({
    assets,
    jobs,
    channels,
    infrastructure: {
      ...describeMediaInfrastructure(),
      ffmpeg: hasFfmpeg,
      autoTranscode: process.env.MEDIA_AUTO_TRANSCODE === "1" || process.env.NODE_ENV !== "production",
      storagePath: process.env.MEDIA_STORAGE_PATH ?? ".data/media",
    },
  });
}
