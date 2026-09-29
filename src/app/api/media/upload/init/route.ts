import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { initUploadSession } from "@/lib/media/ingest";
import { isAwsMediaEnabled } from "@/lib/media/aws/config";
import { defaultChunkSize } from "@/lib/media/paths";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const tmdbId = Number(body?.tmdbId);
  const filename = typeof body?.filename === "string" ? body.filename.trim() : "";
  const totalBytes = Number(body?.totalBytes);
  const chunkSize = Number(body?.chunkSize) || defaultChunkSize();

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "Valid tmdbId is required." }, { status: 400 });
  }
  if (!filename) {
    return NextResponse.json({ error: "filename is required." }, { status: 400 });
  }
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    return NextResponse.json({ error: "totalBytes must be a positive number." }, { status: 400 });
  }

  const result = await initUploadSession({ tmdbId, filename, totalBytes, chunkSize });
  return NextResponse.json({
    sessionId: result.session.id,
    chunkSize: result.session.chunkSize,
    totalChunks: result.session.totalChunks,
    expiresAt: result.session.expiresAt,
    mode: result.mode,
    storage: isAwsMediaEnabled() ? "s3+cloudfront" : "local",
  });
}
