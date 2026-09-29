"use client";

import type { LiveChannel, MediaAsset, TranscodeJob } from "@/lib/media/types";
import { useCallback, useEffect, useState } from "react";

type MediaDashboardData = {
  assets: MediaAsset[];
  jobs: TranscodeJob[];
  channels: LiveChannel[];
  infrastructure: {
    aws: boolean;
    cloudfront: boolean;
    mediaConvert: boolean;
    ivs: boolean;
    drm: string;
    publicPlayback: boolean;
    ffmpeg: boolean;
    autoTranscode: boolean;
    storagePath: string;
  };
};

export function AdminMediaDashboard() {
  const [secret, setSecret] = useState("");
  const [data, setData] = useState<MediaDashboardData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tmdbId, setTmdbId] = useState("550");
  const [liveTitle, setLiveTitle] = useState("FlutterFilms Live Premiere");
  const [liveTmdbId, setLiveTmdbId] = useState("550");
  const [file, setFile] = useState<File | null>(null);

  const authHeaders = useCallback(
    () => ({
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    }),
    [secret],
  );

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/media", { headers: authHeaders() });
    if (!response.ok) {
      setMessage("Admin access required. Enter AI_ADMIN_SECRET or CRON_SECRET.");
      return;
    }
    setData(await response.json());
    setMessage(null);
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runTranscodeQueue() {
    const response = await fetch("/api/admin/media/transcode", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ limit: 5 }),
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? `FFmpeg: ${payload.processed} · MediaConvert polled: ${payload.mediaConvertPolled}`
        : payload.error,
    );
    await load();
  }

  async function createLiveChannel() {
    const response = await fetch("/api/admin/media/live", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        title: liveTitle,
        tmdbId: Number(liveTmdbId),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Failed to create live channel.");
      return;
    }
    setMessage(
      `Live channel ready. RTMP: ${payload.obs.server} · Stream key copied to jobs list.`,
    );
    await load();
  }

  async function uploadVideo() {
    if (!file) {
      setMessage("Choose a video file first.");
      return;
    }
    const movieId = Number(tmdbId);
    if (!Number.isFinite(movieId) || movieId <= 0) {
      setMessage("Enter a valid TMDB movie ID.");
      return;
    }

    setUploading(true);
    setMessage("Initializing chunked upload…");

    try {
      const initResponse = await fetch("/api/media/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          tmdbId: movieId,
          filename: file.name,
          totalBytes: file.size,
        }),
      });
      const init = await initResponse.json();
      if (!initResponse.ok) throw new Error(init.error ?? "Upload init failed.");

      const { sessionId, chunkSize, totalChunks, mode } = init;

      if (mode === "s3") {
        const parts: { partNumber: number; etag: string }[] = [];
        for (let index = 0; index < totalChunks; index += 1) {
          const partUrlResponse = await fetch(
            `/api/media/upload/${sessionId}/part-url?index=${index + 1}`,
            { headers: authHeaders() },
          );
          const partUrlPayload = await partUrlResponse.json();
          if (!partUrlResponse.ok) throw new Error(partUrlPayload.error ?? "Part URL failed.");

          const start = index * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          const uploadResponse = await fetch(partUrlPayload.url, { method: "PUT", body: chunk });
          if (!uploadResponse.ok) throw new Error(`S3 part ${index + 1} upload failed.`);
          const etag = uploadResponse.headers.get("ETag")?.replaceAll('"', "");
          if (!etag) throw new Error(`Missing ETag for part ${index + 1}.`);
          parts.push({ partNumber: index + 1, etag });
          setMessage(`Uploaded S3 part ${index + 1} / ${totalChunks}`);
        }

        const completeResponse = await fetch(`/api/media/upload/${sessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ parts }),
        });
        const complete = await completeResponse.json();
        if (!completeResponse.ok) throw new Error(complete.error ?? "Finalize failed.");
        setMessage(`S3 upload complete. MediaConvert job ${complete.jobId} submitted.`);
      } else {
        for (let index = 0; index < totalChunks; index += 1) {
          const start = index * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          const chunkResponse = await fetch(`/api/media/upload/${sessionId}/chunk`, {
            method: "PUT",
            headers: {
              "x-chunk-index": String(index),
              ...authHeaders(),
            },
            body: chunk,
          });
          const chunkPayload = await chunkResponse.json();
          if (!chunkResponse.ok) throw new Error(chunkPayload.error ?? "Chunk upload failed.");
          setMessage(`Uploaded chunk ${index + 1} / ${totalChunks}`);
        }

        const completeResponse = await fetch(`/api/media/upload/${sessionId}/complete`, {
          method: "POST",
          headers: authHeaders(),
        });
        const complete = await completeResponse.json();
        if (!completeResponse.ok) throw new Error(complete.error ?? "Finalize failed.");
        setMessage(`Upload complete. Asset ${complete.assetId} queued for FFmpeg.`);
      }

      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="ai-usage-card">
        <h2 className="section-title">Admin access</h2>
        <input
          type="password"
          className="mt-3 w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          placeholder="AI_ADMIN_SECRET"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <button type="button" className="btn btn-secondary mt-3" onClick={() => void load()}>
          Refresh
        </button>
      </section>

      {data ? (
        <section className="ai-usage-card">
          <h2 className="section-title">Infrastructure</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            AWS {data.infrastructure.aws ? "on" : "off"} · CloudFront{" "}
            {data.infrastructure.cloudfront ? "on" : "off"} · MediaConvert{" "}
            {data.infrastructure.mediaConvert ? "on" : "off"} · IVS {data.infrastructure.ivs ? "on" : "off"} · DRM{" "}
            {data.infrastructure.drm} · Public URLs (no stream tokens)
          </p>
        </section>
      ) : null}

      <section className="ai-usage-card">
        <h2 className="section-title">VOD: S3 → MediaConvert → CloudFront</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Presigned multipart upload to S3 when AWS is configured; otherwise local FFmpeg fallback. Playback uses public
          CloudFront HLS URLs — no signed tokens.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            TMDB movie ID
            <input
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              value={tmdbId}
              onChange={(event) => setTmdbId(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Source video
            <input
              type="file"
              accept="video/*,.mp4,.mov,.mkv,.m3u8"
              className="mt-1 block w-full text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => void uploadVideo()}>
            {uploading ? "Uploading…" : "Upload video"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void runTranscodeQueue()}>
            Poll transcode queue
          </button>
        </div>
      </section>

      <section className="ai-usage-card">
        <h2 className="section-title">Live: RTMP → Amazon IVS → HLS</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Creates an IVS channel with RTMP ingest (OBS/ffmpeg). Public playback URL maps to the linked TMDB title.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Stream title
            <input
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              value={liveTitle}
              onChange={(event) => setLiveTitle(event.target.value)}
            />
          </label>
          <label className="text-sm">
            TMDB movie ID (optional)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              value={liveTmdbId}
              onChange={(event) => setLiveTmdbId(event.target.value)}
            />
          </label>
        </div>
        <button type="button" className="btn btn-primary mt-4" onClick={() => void createLiveChannel()}>
          Create live channel
        </button>
      </section>

      {message ? <p className="text-sm text-[var(--accent-soft)]">{message}</p> : null}

      <section className="ai-usage-card">
        <h2 className="section-title">Live channels</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(data?.channels ?? []).map((channel) => (
            <div key={channel.id} className="rounded-md border border-[var(--border)] px-3 py-2">
              <p className="font-medium">{channel.title} · {channel.status}</p>
              <p className="text-[var(--text-muted)]">RTMP: {channel.rtmpUrl}</p>
              <p className="text-[var(--text-muted)]">Key: {channel.streamKey}</p>
              <p className="text-[var(--text-muted)]">Playback: {channel.playbackUrl}</p>
            </div>
          ))}
          {!data?.channels?.length ? <p className="text-[var(--text-muted)]">No live channels yet.</p> : null}
        </div>
      </section>

      <section className="ai-usage-card">
        <h2 className="section-title">Media assets</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(data?.assets ?? []).map((asset) => (
            <div key={asset.id} className="rounded-md border border-[var(--border)] px-3 py-2">
              <p className="font-medium">TMDB {asset.tmdbId} · {asset.status}</p>
              <p className="text-[var(--text-muted)]">
                {asset.storageBackend} · {asset.playbackType} · DRM {asset.drmMode} · {asset.id}
              </p>
              {asset.cdnUrl ? <p className="text-[var(--text-muted)]">CDN: {asset.cdnUrl}</p> : null}
            </div>
          ))}
          {!data?.assets?.length ? <p className="text-[var(--text-muted)]">No uploaded assets yet.</p> : null}
        </div>
      </section>

      <section className="ai-usage-card">
        <h2 className="section-title">Transcode jobs</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(data?.jobs ?? []).map((job) => (
            <div key={job.id} className="rounded-md border border-[var(--border)] px-3 py-2">
              <p className="font-medium">{job.provider} · {job.status} · {job.progress}%</p>
              <p className="text-[var(--text-muted)]">asset {job.assetId}</p>
              {job.error ? <p className="text-red-300">{job.error}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
