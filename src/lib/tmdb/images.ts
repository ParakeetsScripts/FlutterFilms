const DEFAULT_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const POSTER_SIZES = ["w92", "w154", "w185", "w342", "w500", "w780", "original"] as const;
export const BACKDROP_SIZES = ["w300", "w780", "w1280", "original"] as const;
export const PROFILE_SIZES = ["w45", "w185", "h632", "original"] as const;
export const LOGO_SIZES = ["w45", "w92", "w154", "w185", "w300", "w500", "original"] as const;

export type PosterSize = (typeof POSTER_SIZES)[number];
export type BackdropSize = (typeof BACKDROP_SIZES)[number];
export type ProfileSize = (typeof PROFILE_SIZES)[number];

export function getImageBaseUrl(): string {
  return process.env.TMDB_IMAGE_BASE_URL || DEFAULT_IMAGE_BASE;
}

function buildUrl(size: string, path: string | null | undefined): string | null {
  if (!path) return null;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getImageBaseUrl()}/${size}${normalized}`;
}

export function getPosterUrl(path: string | null | undefined, size: PosterSize = "w342"): string | null {
  return buildUrl(size, path);
}

export function getBackdropUrl(path: string | null | undefined, size: BackdropSize = "w1280"): string | null {
  return buildUrl(size, path);
}

export function getProfileUrl(path: string | null | undefined, size: ProfileSize = "w185"): string | null {
  return buildUrl(size, path);
}

export function getLogoUrl(path: string | null | undefined, size: (typeof LOGO_SIZES)[number] = "w185"): string | null {
  return buildUrl(size, path);
}

export function getProviderLogoUrl(path: string | null | undefined): string | null {
  return buildUrl("w45", path);
}
