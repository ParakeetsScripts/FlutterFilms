import { getMediaAsset } from "@/lib/media/repository";
import { assetRoot, safeJoin } from "@/lib/media/paths";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".m3u8") return "application/vnd.apple.mpegurl";
  if (ext === ".ts") return "video/mp2t";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mpd") return "application/dash+xml";
  return "application/octet-stream";
}

/** Public local fallback when S3/CloudFront is not configured. No tokens required. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string; path: string[] }> },
) {
  const { assetId, path: segments } = await context.params;

  const asset = await getMediaAsset(assetId);
  if (!asset || asset.status !== "ready" || !asset.published) {
    return NextResponse.json({ error: "Stream unavailable." }, { status: 404 });
  }
  if (asset.storageBackend === "s3") {
    return NextResponse.json(
      { error: "This asset is served from CloudFront. Configure AWS_CLOUDFRONT_DOMAIN." },
      { status: 404 },
    );
  }

  const relativePath = segments.join("/");
  const base = asset.storagePath || assetRoot(assetId);
  const resolved = safeJoin(base, relativePath);
  if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return NextResponse.json({ error: "Segment not found." }, { status: 404 });
  }

  const data = fs.readFileSync(resolved);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(resolved),
      "Cache-Control": "public, max-age=300",
      "Accept-Ranges": "bytes",
    },
  });
}
