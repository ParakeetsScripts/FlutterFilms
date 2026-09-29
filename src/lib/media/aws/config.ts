import "server-only";

export type DrmMode = "none" | "aes128" | "widevine_fairplay";

export function isAwsMediaEnabled(): boolean {
  return Boolean(
    process.env.AWS_S3_BUCKET?.trim() &&
      process.env.AWS_REGION?.trim() &&
      (process.env.AWS_ACCESS_KEY_ID?.trim() || process.env.AWS_PROFILE?.trim()),
  );
}

export function awsRegion(): string {
  return process.env.AWS_REGION?.trim() || "us-east-1";
}

export function awsS3Bucket(): string {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) throw new Error("AWS_S3_BUCKET is not configured.");
  return bucket;
}

export function cloudfrontDomain(): string | null {
  const domain = process.env.AWS_CLOUDFRONT_DOMAIN?.trim();
  return domain ? domain.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
}

export function mediaConvertRoleArn(): string | null {
  return process.env.AWS_MEDIACONVERT_ROLE_ARN?.trim() || null;
}

export function mediaConvertEndpoint(): string | null {
  return process.env.AWS_MEDIACONVERT_ENDPOINT?.trim() || null;
}

export function mediaConvertQueueArn(): string | null {
  return process.env.AWS_MEDIACONVERT_QUEUE_ARN?.trim() || null;
}

export function drmMode(): DrmMode {
  const mode = process.env.MEDIA_DRM_MODE?.trim() as DrmMode | undefined;
  if (mode === "aes128" || mode === "widevine_fairplay") return mode;
  return "none";
}

export function spekeUrl(): string | null {
  return process.env.AWS_SPEKE_URL?.trim() || null;
}

export function isIvsEnabled(): boolean {
  return isAwsMediaEnabled() && process.env.AWS_IVS_ENABLED !== "0";
}

export function vodOutputPrefix(assetId: string): string {
  return `vod/${assetId}`;
}

export function uploadKey(sessionId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `uploads/${sessionId}/${safe}`;
}

export function s3Uri(key: string): string {
  return `s3://${awsS3Bucket()}/${key}`;
}
