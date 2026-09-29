import type { Video } from "./types";

const TYPE_PRIORITY = ["Trailer", "Teaser", "Featurette", "Clip", "Behind the Scenes"];

export type TmdbVideoRaw = {
  id?: string;
  name?: string;
  key?: string;
  site?: string;
  type?: string;
  official?: boolean;
  published_at?: string | null;
};

function mapTmdbVideo(video: TmdbVideoRaw): Video | null {
  if (!video.id || !video.key || !video.site) return null;
  return {
    id: video.id,
    name: video.name ?? "Video",
    key: video.key,
    site: video.site,
    type: video.type ?? "Video",
    official: Boolean(video.official),
    publishedAt: video.published_at ?? null,
  };
}

export function normalizeTmdbVideos(raw: TmdbVideoRaw[] | undefined | null): Video[] {
  return (raw ?? []).map(mapTmdbVideo).filter((item): item is Video => item !== null);
}

export function prioritizeVideos(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => {
    const aOfficial = a.official ? 0 : 1;
    const bOfficial = b.official ? 0 : 1;
    if (aOfficial !== bOfficial) return aOfficial - bOfficial;
    const aType = TYPE_PRIORITY.indexOf(a.type);
    const bType = TYPE_PRIORITY.indexOf(b.type);
    return (aType === -1 ? 99 : aType) - (bType === -1 ? 99 : bType);
  });
}

export function getPrimaryTrailer(videos: Video[]): Video | null {
  const ranked = prioritizeVideos(videos);
  return (
    ranked.find((video) => video.site === "YouTube" && video.type === "Trailer") ??
    ranked.find((video) => video.site === "YouTube" && video.type === "Teaser") ??
    ranked.find((video) => video.site === "YouTube") ??
    null
  );
}

/** Prefer scene clips for cinematic hero backgrounds, then trailers. */
export function getPrimaryHeroVideo(videos: Video[]): Video | null {
  const ranked = prioritizeVideos(videos);
  return (
    ranked.find((video) => video.site === "YouTube" && video.type === "Clip") ??
    ranked.find((video) => video.site === "YouTube" && video.type === "Trailer") ??
    ranked.find((video) => video.site === "YouTube" && video.type === "Teaser") ??
    ranked.find((video) => video.site === "YouTube") ??
    null
  );
}

export function youtubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(key)}`;
}

export function youtubeWatchUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`;
}
