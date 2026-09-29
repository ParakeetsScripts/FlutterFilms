import { buildHostedPlaybackSource } from "@/lib/media/playback";
import type { PlaybackProvider } from "../types";

export const hostedVodProvider: PlaybackProvider = {
  id: "flutterfilms-vod",
  name: "FlutterFilms VOD",
  type: "authorized_stream",
  async isAvailable(movieId) {
    const source = await buildHostedPlaybackSource(movieId);
    return Boolean(source);
  },
  async getSource(movieId) {
    return buildHostedPlaybackSource(movieId);
  },
};
