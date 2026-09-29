import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { finalizeUploadSession, type S3UploadPart } from "@/lib/media/ingest";
import { getUploadSession, markUploadChunkReceived } from "@/lib/media/repository";
import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const { sessionId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parts = Array.isArray(body?.parts) ? (body.parts as S3UploadPart[]) : undefined;

  try {
    const session = await getUploadSession(sessionId);
    if (session?.storageBackend === "s3" && parts?.length) {
      await markUploadChunkReceived(sessionId, session.totalChunks);
    }

    const result = await finalizeUploadSession(sessionId, parts);
    return NextResponse.json({
      assetId: result.asset.id,
      jobId: result.jobId,
      status: result.asset.status,
      tmdbId: result.asset.tmdbId,
      mode: result.mode,
      playbackUrl: result.asset.cdnUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload finalize failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
