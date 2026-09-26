import { getMovie } from "@/lib/tmdb/movies";
import { getPrimaryTrailer, youtubeWatchUrl } from "@/lib/tmdb/videos";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { PlaybackProvider, PlaybackSource } from "../types";

export const trailerProvider: PlaybackProvider = {
  id: "youtube-trailer",
  name: "Official trailer",
  type: "trailer",
  async isAvailable(movieId) {
    const source = await this.getSource(movieId, "US");
    return Boolean(source);
  },
  async getSource(movieId): Promise<PlaybackSource | null> {
    const movie = await getMovie(movieId);
    if (!movie) return null;
    const trailer = getPrimaryTrailer(movie.videos);
    if (!trailer) return null;
    return {
      providerId: "youtube-trailer",
      movieId,
      type: "embed",
      url: youtubeWatchUrl(trailer.key),
      poster: getPosterUrl(movie.posterPath, "w500") ?? undefined,
      title: `${movie.title} trailer`,
    };
  },
};
