import "server-only";

import { cloudfrontDomain } from "./config";

export function buildCdnUrl(keyPath: string): string | null {
  const domain = cloudfrontDomain();
  if (!domain) return null;
  const normalized = keyPath.replace(/^\/+/, "");
  return `https://${domain}/${normalized}`;
}

export function buildVodManifestUrl(assetId: string, manifest = "master.m3u8"): string | null {
  return buildCdnUrl(`vod/${assetId}/${manifest}`);
}
