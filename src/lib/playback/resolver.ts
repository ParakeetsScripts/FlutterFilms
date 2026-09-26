import "server-only";

import { getMovie } from "@/lib/tmdb/movies";
import { getEnabledProviders } from "@/lib/providers.config";
import { einthusanProvider } from "./providers/einthusan";
import { ownedMediaProvider } from "./providers/owned-media";
import { tmdbExternalProvider } from "./providers/tmdb-external";
import { trailerProvider } from "./providers/trailer";
import type { ExternalOffer, PlaybackProvider, PlaybackResolution, PlaybackSource } from "./types";

const providers: PlaybackProvider[] = [
  ownedMediaProvider,
  einthusanProvider,
  trailerProvider,
  tmdbExternalProvider,
];

function enabled(provider: PlaybackProvider) {
  const config = getEnabledProviders().find((item) => item.id === provider.id);
  return Boolean(config);
}

export async function resolvePlayback(movieId: number, region = "US"): Promise<PlaybackResolution> {
  const movie = await getMovie(movieId, { region });
  if (!movie) {
    return {
      status: "NO_PLAYBACK_SOURCE",
      source: null,
      sources: [],
      external: [],
      trailer: null,
    };
  }

  const sources: PlaybackSource[] = [];
  for (const provider of providers) {
    if (!enabled(provider)) continue;
    const source = await provider.getSource(movieId, region);
    if (source?.url) sources.push(source);
  }

  const playable = sources.filter((source) => source.type === "hls" || source.type === "dash" || source.type === "mp4");
  const trailer = sources.find((source) => source.providerId === "youtube-trailer") ?? null;
  const externalSource = sources.find((source) => source.type === "external") ?? null;
  const providersGroup = movie.watchProviders;
  const external: ExternalOffer[] = providersGroup
    ? [
        ...providersGroup.streaming.map((item) => ({
          providerId: String(item.id),
          name: item.name,
          url: providersGroup.link ?? "",
          kind: "flatrate" as const,
        })),
        ...providersGroup.rent.map((item) => ({
          providerId: String(item.id),
          name: item.name,
          url: providersGroup.link ?? "",
          kind: "rent" as const,
        })),
        ...providersGroup.buy.map((item) => ({
          providerId: String(item.id),
          name: item.name,
          url: providersGroup.link ?? "",
          kind: "buy" as const,
        })),
      ].filter((item) => item.url)
    : [];

  if (playable[0]) {
    return { status: "PLAYABLE", source: playable[0], sources: playable, external, trailer };
  }
  if (externalSource || external.length) {
    return { status: "AVAILABLE_EXTERNALLY", source: externalSource, sources: [], external, trailer };
  }
  if (trailer) {
    return { status: "TRAILER_ONLY", source: trailer, sources: [], external, trailer };
  }
  return { status: "NO_PLAYBACK_SOURCE", source: null, sources: [], external, trailer: null };
}

