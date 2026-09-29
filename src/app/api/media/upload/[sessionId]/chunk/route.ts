import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { writeUploadChunk } from "@/lib/media/ingest";
import { NextResponse } from "next/server";

export async function PUT(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const { sessionId } = await context.params;
  const chunkIndex = Number(request.headers.get("x-chunk-index"));
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return NextResponse.json({ error: "x-chunk-index header is required." }, { status: 400 });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length) {
    return NextResponse.json({ error: "Empty chunk body." }, { status: 400 });
  }

  try {
    const progress = await writeUploadChunk(sessionId, chunkIndex, bytes);
    return NextResponse.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chunk upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
