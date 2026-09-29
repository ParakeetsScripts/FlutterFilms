import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { awsS3Bucket, drmMode, isAwsMediaEnabled, uploadKey } from "@/lib/media/aws/config";
import { buildVodManifestUrl } from "@/lib/media/aws/cloudfront";
import { completeMultipartUpload, createMultipartUpload } from "@/lib/media/aws/s3";
import { assetRoot, defaultChunkSize, uploadTempRoot } from "./paths";
import {
  completeUploadSession,
  createMediaAsset,
  createTranscodeJob,
  createUploadSession,
  getUploadSession,
  markUploadChunkReceived,
} from "./repository";
import { queueTranscodeForAsset } from "./transcode";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function computeTotalChunks(totalBytes: number, chunkSize = defaultChunkSize()): number {
  return Math.max(1, Math.ceil(totalBytes / chunkSize));
}

export async function initUploadSession(input: {
  tmdbId: number;
  filename: string;
  totalBytes: number;
  chunkSize?: number;
}) {
  const chunkSize = input.chunkSize ?? defaultChunkSize();
  const sessionId = randomUUID();
  const totalChunks = computeTotalChunks(input.totalBytes, chunkSize);

  if (isAwsMediaEnabled()) {
    const s3Key = uploadKey(sessionId, input.filename);
    const uploadId = await createMultipartUpload(s3Key);
    const session = await createUploadSession({
      id: sessionId,
      tmdbId: input.tmdbId,
      filename: input.filename,
      totalBytes: input.totalBytes,
      chunkSize,
      totalChunks,
      tempPath: "",
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      storageBackend: "s3",
      s3UploadId: uploadId,
      s3Key,
    });
    return { session, mode: "s3" as const };
  }

  const tempDir = path.join(uploadTempRoot(), sessionId);
  fs.mkdirSync(tempDir, { recursive: true });
  const session = await createUploadSession({
    id: sessionId,
    tmdbId: input.tmdbId,
    filename: input.filename,
    totalBytes: input.totalBytes,
    chunkSize,
    totalChunks,
    tempPath: tempDir,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    storageBackend: "local",
  });
  return { session, mode: "local" as const };
}

export async function writeUploadChunk(sessionId: string, chunkIndex: number, bytes: Buffer): Promise<UploadSessionProgress> {
  const session = await getUploadSession(sessionId);
  if (!session) throw new Error("Upload session not found.");
  if (session.status !== "open") throw new Error("Upload session is not open.");
  if (session.storageBackend === "s3") {
    throw new Error("S3 uploads must use direct presigned part URLs.");
  }
  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) throw new Error("Invalid chunk index.");

  const chunkPath = path.join(session.tempPath, `chunk-${String(chunkIndex).padStart(6, "0")}`);
  fs.writeFileSync(chunkPath, bytes);

  const received = Math.max(session.receivedChunks, chunkIndex + 1);
  await markUploadChunkReceived(sessionId, received);

  return {
    sessionId,
    receivedChunks: received,
    totalChunks: session.totalChunks,
    complete: received >= session.totalChunks,
    mode: "local",
  };
}

export type UploadSessionProgress = {
  sessionId: string;
  receivedChunks: number;
  totalChunks: number;
  complete: boolean;
  mode: "local" | "s3";
};

export type S3UploadPart = { partNumber: number; etag: string };

export async function finalizeUploadSession(sessionId: string, s3Parts?: S3UploadPart[]) {
  const session = await getUploadSession(sessionId);
  if (!session) throw new Error("Upload session not found.");

  const assetId = randomUUID();
  const sourceFilename = path.basename(session.filename);

  if (session.storageBackend === "s3") {
    if (!session.s3Key || !session.s3UploadId) throw new Error("S3 session is missing upload metadata.");
    if (!s3Parts?.length) throw new Error("S3 multipart completion requires part ETags.");
    await completeMultipartUpload({
      key: session.s3Key,
      uploadId: session.s3UploadId,
      parts: s3Parts,
    });
    await completeUploadSession(sessionId);

    const cdnBase = buildVodManifestUrl(assetId)?.replace(/\/master\.m3u8$/, "") ?? null;
    const asset = await createMediaAsset({
      id: assetId,
      tmdbId: session.tmdbId,
      sourceFilename,
      storagePath: `s3://${awsS3Bucket()}/${session.s3Key}`,
      status: "pending",
      storageBackend: "s3",
      s3Bucket: awsS3Bucket(),
      s3SourceKey: session.s3Key,
      cdnUrl: cdnBase ?? undefined,
      drmMode: drmMode(),
    });

    const jobId = randomUUID();
    await createTranscodeJob(jobId, asset.id, "mediaconvert");
    void queueTranscodeForAsset(jobId);
    return { asset, jobId, mode: "s3" as const };
  }

  if (session.receivedChunks < session.totalChunks) {
    throw new Error("Upload is incomplete.");
  }

  const storagePath = assetRoot(assetId);
  const targetPath = path.join(storagePath, sourceFilename);
  const writeStream = fs.createWriteStream(targetPath);

  for (let index = 0; index < session.totalChunks; index += 1) {
    const chunkPath = path.join(session.tempPath, `chunk-${String(index).padStart(6, "0")}`);
    const chunk = fs.readFileSync(chunkPath);
    writeStream.write(chunk);
    fs.unlinkSync(chunkPath);
  }
  writeStream.end();
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  fs.rmSync(session.tempPath, { recursive: true, force: true });
  await completeUploadSession(sessionId);

  const asset = await createMediaAsset({
    id: assetId,
    tmdbId: session.tmdbId,
    sourceFilename,
    storagePath,
    status: "pending",
    storageBackend: "local",
    drmMode: drmMode(),
  });

  const jobId = randomUUID();
  await createTranscodeJob(jobId, asset.id, "ffmpeg");
  void queueTranscodeForAsset(jobId);
  return { asset, jobId, mode: "local" as const };
}
