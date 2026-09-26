import type { PlaybackProvider, PlaybackSource } from "../types";

/**
 * EinthusanProvider
 *
 * enabled: false
 * status: Requires explicit authorization/API agreement
 *
 * Enable only after verifying official API access, permission, and lawful
 * playback/deep-link terms. Do not scrape Einthusan, extract hidden stream
 * URLs, bypass its player/DRM/authentication/geo-blocking, or proxy streams.
 */
export const einthusanProvider: PlaybackProvider = {
  id: "einthusan",
  name: "Einthusan",
  type: "authorized_stream",
  async isAvailable() {
    return false;
  },
  async getSource(): Promise<PlaybackSource | null> {
    return null;
  },
};
