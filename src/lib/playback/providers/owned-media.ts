import type { PlaybackProvider, PlaybackSource } from "../types";

const localSources = new Map<number, PlaybackSource>();

export function registerOwnedMedia(source: PlaybackSource) {
  if (source.providerId !== "local-media") {
    throw new Error("Only local-media sources can be registered as owned media.");
  }
  localSources.set(source.movieId, source);
}

export function unregisterOwnedMedia(movieId: number) {
  localSources.delete(movieId);
}

export const ownedMediaProvider: PlaybackProvider = {
  id: "local-media",
  name: "My library",
  type: "owned_media",
  async isAvailable(movieId) {
    return localSources.has(movieId);
  },
  async getSource(movieId) {
    return localSources.get(movieId) ?? null;
  },
};
