import "server-only";

import { buildVodManifestUrl } from "@/lib/media/aws/cloudfront";
import { isAwsMediaEnabled } from "@/lib/media/aws/config";
import { getServerOrigin } from "@/lib/site-url";
import type { MediaAsset } from "./types";

export function buildPublicPlaybackUrl(asset: MediaAsset): string | null {
  if (!asset.manifestRelpath) return null;

  if (asset.cdnUrl) {
    return `${asset.cdnUrl.replace(/\/$/, "")}/${asset.manifestRelpath}`;
  }

  if (isAwsMediaEnabled()) {
    const cdn = buildVodManifestUrl(asset.id, asset.manifestRelpath);
    if (cdn) return cdn;
  }

  const origin = getServerOrigin();
  return `${origin}/api/media/stream/${asset.id}/${asset.manifestRelpath}`;
}
