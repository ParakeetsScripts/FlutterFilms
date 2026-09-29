import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { presignUploadPart } from "@/lib/media/aws/s3";
import { getUploadSession } from "@/lib/media/repository";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  const { sessionId } = await context.params;
  const partNumber = Number(new URL(request.url).searchParams.get("index"));
  if (!Number.isInteger(partNumber) || partNumber < 1) {
    return NextResponse.json({ error: "index query param is required (1-based)." }, { status: 400 });
  }

  const session = await getUploadSession(sessionId);
  if (!session || session.storageBackend !== "s3" || !session.s3Key || !session.s3UploadId) {
    return NextResponse.json({ error: "S3 upload session not found." }, { status: 404 });
  }

  const url = await presignUploadPart({
    key: session.s3Key,
    uploadId: session.s3UploadId,
    partNumber,
  });

  return NextResponse.json({ url, partNumber });
}
