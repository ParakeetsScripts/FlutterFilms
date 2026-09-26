import { getProvider } from "@/lib/providers.config";
import type { PlaybackSource } from "./types";

export function assertAuthorizedSource(source: PlaybackSource): PlaybackSource {
  const provider = getProvider(source.providerId);
  if (!provider || !provider.enabled) {
    throw new Error("Provider is not enabled.");
  }
  if (!source.url) {
    throw new Error("Playback source is missing a URL.");
  }
  if (source.drmRequired && provider.legalStatus === "requires_authorization") {
    throw new Error("DRM sources require an authorized provider integration.");
  }
  return source;
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
