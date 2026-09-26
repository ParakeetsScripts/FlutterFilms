import type { Video } from "./types";

const TYPE_PRIORITY = ["Trailer", "Teaser", "Featurette", "Clip"];

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
  return (
    prioritizeVideos(videos).find((video) => video.site === "YouTube" && video.type === "Trailer") ??
    prioritizeVideos(videos).find((video) => video.site === "YouTube") ??
    null
  );
}

export function youtubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(key)}`;
}

export function youtubeWatchUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`;
}
