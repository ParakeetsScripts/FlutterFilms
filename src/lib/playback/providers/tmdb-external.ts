import { getMovie } from "@/lib/tmdb/movies";
import type { PlaybackProvider, PlaybackSource } from "../types";

export const tmdbExternalProvider: PlaybackProvider = {
  id: "justwatch-via-tmdb",
  name: "Where to watch",
  type: "external_link",
  async isAvailable(movieId, region) {
    const source = await this.getSource(movieId, region);
    return Boolean(source);
  },
  async getSource(movieId, region): Promise<PlaybackSource | null> {
    const movie = await getMovie(movieId, { region });
    const providers = movie?.watchProviders;
    if (!providers?.link) return null;
    const hasOffers =
      providers.streaming.length + providers.rent.length + providers.buy.length + providers.free.length > 0;
    if (!hasOffers) return null;
    return {
      providerId: "justwatch-via-tmdb",
      movieId,
      type: "external",
      url: providers.link,
      title: "Where to watch",
    };
  },
};
