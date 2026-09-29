import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { createLiveChannel, listLiveChannels } from "@/lib/media/live-repository";
import { createLiveChannel as createIvsChannel, ivsReady, rtmpIngestUrl } from "@/lib/media/aws/ivs";
import { drmMode } from "@/lib/media/aws/config";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;
  const channels = await listLiveChannels(100);
  return NextResponse.json({ channels, ivsReady: ivsReady() });
}

export async function POST(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const tmdbId = body?.tmdbId == null ? undefined : Number(body.tmdbId);

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  try {
    const ivs = await createIvsChannel({ name: title, authorized: false });
    const channel = await createLiveChannel({
      id: randomUUID(),
      tmdbId: Number.isFinite(tmdbId) ? tmdbId : undefined,
      title,
      ingestEndpoint: ivs.ingestEndpoint,
      streamKey: ivs.streamKey,
      rtmpUrl: rtmpIngestUrl(ivs.ingestEndpoint),
      playbackUrl: ivs.playbackUrl,
      ivsChannelArn: ivs.channelArn,
      drmMode: drmMode(),
    });

    return NextResponse.json({
      channel,
      obs: {
        server: rtmpIngestUrl(ivs.ingestEndpoint),
        streamKey: ivs.streamKey,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create live channel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
