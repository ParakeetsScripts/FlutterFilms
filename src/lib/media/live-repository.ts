import "server-only";

import { getDatabase } from "@/lib/db/client";
import type { DrmMode, LiveChannel, LiveChannelStatus } from "./types";

function mapLive(row: Record<string, unknown>): LiveChannel {
  return {
    id: String(row.id),
    tmdbId: row.tmdb_id == null ? null : Number(row.tmdb_id),
    title: String(row.title),
    status: String(row.status) as LiveChannelStatus,
    ingestEndpoint: String(row.ingest_endpoint),
    streamKey: String(row.stream_key),
    rtmpUrl: String(row.rtmp_url),
    playbackUrl: String(row.playback_url),
    ivsChannelArn: String(row.ivs_channel_arn),
    drmMode: String(row.drm_mode) as DrmMode,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createLiveChannel(input: {
  id: string;
  tmdbId?: number;
  title: string;
  ingestEndpoint: string;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  ivsChannelArn: string;
  drmMode?: DrmMode;
}): Promise<LiveChannel> {
  const now = new Date().toISOString();
  const db = await getDatabase();
  await db.run(
    `INSERT INTO live_channels
      (id, tmdb_id, title, status, ingest_endpoint, stream_key, rtmp_url, playback_url, ivs_channel_arn, drm_mode, created_at, updated_at)
     VALUES (?, ?, ?, 'idle', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.tmdbId ?? null,
      input.title,
      input.ingestEndpoint,
      input.streamKey,
      input.rtmpUrl,
      input.playbackUrl,
      input.ivsChannelArn,
      input.drmMode ?? "none",
      now,
      now,
    ],
  );
  const row = await db.get("SELECT * FROM live_channels WHERE id = ?", [input.id]);
  return mapLive(row!);
}

export async function listLiveChannels(limit = 50): Promise<LiveChannel[]> {
  const db = await getDatabase();
  const rows = await db.all("SELECT * FROM live_channels ORDER BY updated_at DESC LIMIT ?", [limit]);
  return rows.map(mapLive);
}

export async function getActiveLiveChannelForMovie(tmdbId: number): Promise<LiveChannel | null> {
  const db = await getDatabase();
  const row = await db.get(
    `SELECT * FROM live_channels
     WHERE tmdb_id = ? AND status IN ('idle', 'live')
     ORDER BY updated_at DESC LIMIT 1`,
    [tmdbId],
  );
  return row ? mapLive(row) : null;
}

export async function updateLiveChannelStatus(id: string, status: LiveChannelStatus): Promise<void> {
  const db = await getDatabase();
  await db.run("UPDATE live_channels SET status = ?, updated_at = ? WHERE id = ?", [
    status,
    new Date().toISOString(),
    id,
  ]);
}
