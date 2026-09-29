export type MediaAssetStatus = "uploading" | "pending" | "processing" | "ready" | "failed";
export type TranscodeJobStatus = "queued" | "processing" | "completed" | "failed";
export type UploadSessionStatus = "open" | "completed" | "expired" | "failed";
export type StorageBackend = "local" | "s3";
export type DrmMode = "none" | "aes128" | "widevine_fairplay";
export type TranscodeProvider = "ffmpeg" | "mediaconvert";
export type LiveChannelStatus = "idle" | "live" | "offline";

export type MediaAsset = {
  id: string;
  tmdbId: number;
  title: string | null;
  status: MediaAssetStatus;
  sourceFilename: string | null;
  storagePath: string;
  manifestRelpath: string | null;
  playbackType: "hls" | "mp4" | "dash";
  durationSeconds: number | null;
  published: boolean;
  storageBackend: StorageBackend;
  s3Bucket: string | null;
  s3SourceKey: string | null;
  cdnUrl: string | null;
  drmMode: DrmMode;
  awsJobId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadSession = {
  id: string;
  tmdbId: number;
  filename: string;
  totalBytes: number;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: number;
  status: UploadSessionStatus;
  tempPath: string;
  storageBackend: StorageBackend;
  s3UploadId: string | null;
  s3Key: string | null;
  createdAt: string;
  expiresAt: string;
};

export type TranscodeJob = {
  id: string;
  assetId: string;
  status: TranscodeJobStatus;
  progress: number;
  error: string | null;
  provider: TranscodeProvider;
  awsJobId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type LiveChannel = {
  id: string;
  tmdbId: number | null;
  title: string;
  status: LiveChannelStatus;
  ingestEndpoint: string;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  ivsChannelArn: string;
  drmMode: DrmMode;
  createdAt: string;
  updatedAt: string;
};
