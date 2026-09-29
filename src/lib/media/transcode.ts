import "server-only";

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { buildVodManifestUrl } from "@/lib/media/aws/cloudfront";
import { drmMode, isAwsMediaEnabled, mediaConvertRoleArn } from "@/lib/media/aws/config";
import { defaultManifestKey, getMediaConvertJob, submitVodTranscodeJob } from "@/lib/media/aws/mediaconvert";
import { assetRoot } from "./paths";
import {
  getMediaAsset,
  listQueuedTranscodeJobs,
  updateMediaAsset,
  updateTranscodeJob,
} from "./repository";

const execFileAsync = promisify(execFile);

export async function ffmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

async function probeDurationSeconds(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const value = Number(stdout.trim());
    return Number.isFinite(value) ? Math.round(value) : null;
  } catch {
    return null;
  }
}

export async function queueTranscodeForAsset(jobId: string): Promise<void> {
  const jobs = await listQueuedTranscodeJobs(50);
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;

  if (job.provider === "mediaconvert" && isAwsMediaEnabled() && mediaConvertRoleArn()) {
    await processMediaConvertJob(jobId);
    return;
  }

  if (process.env.MEDIA_AUTO_TRANSCODE === "1" || process.env.NODE_ENV !== "production") {
    await processFfmpegJob(jobId);
  }
}

async function processMediaConvertJob(jobId: string): Promise<void> {
  const jobs = await listQueuedTranscodeJobs(50);
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;

  const asset = await getMediaAsset(job.assetId);
  if (!asset?.s3SourceKey) {
    await updateTranscodeJob(jobId, {
      status: "failed",
      error: "Missing S3 source key",
      finishedAt: new Date().toISOString(),
    });
    return;
  }

  const startedAt = new Date().toISOString();
  await updateTranscodeJob(jobId, { status: "processing", progress: 10, startedAt, provider: "mediaconvert" });
  await updateMediaAsset(asset.id, { status: "processing" });

  try {
    const awsJobId = await submitVodTranscodeJob({
      assetId: asset.id,
      sourceKey: asset.s3SourceKey,
    });
    await updateTranscodeJob(jobId, { awsJobId, progress: 15 });
    await updateMediaAsset(asset.id, { awsJobId });
    await pollMediaConvertJob(jobId, awsJobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "MediaConvert submit failed";
    await updateTranscodeJob(jobId, { status: "failed", error: message, finishedAt: new Date().toISOString() });
    await updateMediaAsset(asset.id, { status: "failed" });
  }
}

async function pollMediaConvertJob(jobId: string, awsJobId: string): Promise<void> {
  const jobs = await listQueuedTranscodeJobs(50);
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  const asset = await getMediaAsset(job.assetId);
  if (!asset) return;

  const remote = await getMediaConvertJob(awsJobId);
  if (remote.status === "PROGRESSING" || remote.status === "SUBMITTED") {
    await updateTranscodeJob(jobId, { status: "processing", progress: Math.max(20, remote.progress) });
    return;
  }

  if (remote.status === "COMPLETE") {
    const manifest = "master.m3u8";
    const cdnUrl = buildVodManifestUrl(asset.id, manifest)?.replace(/\/master\.m3u8$/, "") ?? asset.cdnUrl;
    await updateMediaAsset(asset.id, {
      status: "ready",
      manifestRelpath: manifest,
      playbackType: "hls",
      published: true,
      cdnUrl: cdnUrl ?? undefined,
      drmMode: drmMode(),
    });
    await updateTranscodeJob(jobId, {
      status: "completed",
      progress: 100,
      finishedAt: new Date().toISOString(),
    });
    return;
  }

  await updateMediaAsset(asset.id, { status: "failed" });
  await updateTranscodeJob(jobId, {
    status: "failed",
    error: remote.errorMessage ?? `MediaConvert status: ${remote.status}`,
    finishedAt: new Date().toISOString(),
  });
}

export async function pollMediaConvertQueue(limit = 10): Promise<number> {
  const jobs = await listQueuedTranscodeJobs(limit).then((items) =>
    items.filter((job) => job.provider === "mediaconvert" && job.awsJobId),
  );
  for (const job of jobs) {
    if (job.awsJobId) await pollMediaConvertJob(job.id, job.awsJobId);
  }
  return jobs.length;
}

async function processFfmpegJob(jobId: string): Promise<void> {
  const jobs = await listQueuedTranscodeJobs(50);
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;

  const asset = await getMediaAsset(job.assetId);
  if (!asset) {
    await updateTranscodeJob(jobId, {
      status: "failed",
      error: "Asset not found",
      finishedAt: new Date().toISOString(),
    });
    return;
  }

  const sourcePath = path.join(asset.storagePath, asset.sourceFilename ?? "source.bin");
  if (!fs.existsSync(sourcePath)) {
    await updateTranscodeJob(jobId, {
      status: "failed",
      error: "Source file missing",
      finishedAt: new Date().toISOString(),
    });
    await updateMediaAsset(asset.id, { status: "failed" });
    return;
  }

  const startedAt = new Date().toISOString();
  await updateTranscodeJob(jobId, { status: "processing", progress: 5, startedAt, provider: "ffmpeg" });
  await updateMediaAsset(asset.id, { status: "processing" });

  const outputDir = assetRoot(asset.id);
  const lower = sourcePath.toLowerCase();

  try {
    if (lower.endsWith(".m3u8")) {
      const manifest = path.basename(sourcePath);
      fs.copyFileSync(sourcePath, path.join(outputDir, manifest));
      await updateMediaAsset(asset.id, {
        status: "ready",
        manifestRelpath: manifest,
        playbackType: "hls",
        published: true,
        drmMode: drmMode(),
      });
      await updateTranscodeJob(jobId, { status: "completed", progress: 100, finishedAt: new Date().toISOString() });
      return;
    }

    if (lower.endsWith(".mp4") && !(await ffmpegAvailable())) {
      const target = "progressive.mp4";
      fs.copyFileSync(sourcePath, path.join(outputDir, target));
      await updateMediaAsset(asset.id, {
        status: "ready",
        manifestRelpath: target,
        playbackType: "mp4",
        published: true,
      });
      await updateTranscodeJob(jobId, { status: "completed", progress: 100, finishedAt: new Date().toISOString() });
      return;
    }

    if (!(await ffmpegAvailable())) {
      throw new Error("ffmpeg is not installed on this host.");
    }

    const manifestName = "master.m3u8";
    const segmentPattern = path.join(outputDir, "segment%03d.ts");
    await updateTranscodeJob(jobId, { progress: 20 });
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      sourcePath,
      "-codec:v",
      "libx264",
      "-preset",
      "veryfast",
      "-codec:a",
      "aac",
      "-movflags",
      "+faststart",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      segmentPattern,
      path.join(outputDir, manifestName),
    ]);

    const durationSeconds = await probeDurationSeconds(sourcePath);
    await updateMediaAsset(asset.id, {
      status: "ready",
      manifestRelpath: manifestName,
      playbackType: "hls",
      durationSeconds: durationSeconds ?? undefined,
      published: true,
      drmMode: drmMode(),
    });
    await updateTranscodeJob(jobId, { status: "completed", progress: 100, finishedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcode failed";
    await updateMediaAsset(asset.id, { status: "failed" });
    await updateTranscodeJob(jobId, {
      status: "failed",
      error: message,
      finishedAt: new Date().toISOString(),
    });
  }
}

export async function processTranscodeJob(jobId: string): Promise<void> {
  const jobs = await listQueuedTranscodeJobs(50);
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return;
  if (job.provider === "mediaconvert") {
    if (job.awsJobId) await pollMediaConvertJob(jobId, job.awsJobId);
    else await processMediaConvertJob(jobId);
    return;
  }
  await processFfmpegJob(jobId);
}

export async function processTranscodeQueue(limit = 3): Promise<number> {
  const polled = await pollMediaConvertQueue(limit);
  const jobs = await listQueuedTranscodeJobs(limit).then((items) =>
    items.filter((job) => job.provider === "ffmpeg"),
  );
  for (const job of jobs) {
    await processFfmpegJob(job.id);
  }
  return polled + jobs.length;
}
