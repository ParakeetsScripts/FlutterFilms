export type PlaybackType = "hls" | "dash" | "mp4" | "embed" | "external";
export type ProviderKind = "authorized_stream" | "owned_media" | "trailer" | "external_link";
export type PlaybackStatus = "PLAYABLE" | "AVAILABLE_EXTERNALLY" | "TRAILER_ONLY" | "NO_PLAYBACK_SOURCE";

export type PlaybackSource = {
  providerId: string;
  movieId: number;
  type: PlaybackType;
  url: string;
  poster?: string;
  title?: string;
  expiresAt?: string;
  requiresAuth?: boolean;
  drmRequired?: boolean;
};

export type ExternalOffer = {
  providerId: string;
  name: string;
  url: string;
  kind: "flatrate" | "rent" | "buy" | "ads" | "free";
};

export type PlaybackResolution = {
  status: PlaybackStatus;
  source: PlaybackSource | null;
  sources: PlaybackSource[];
  external: ExternalOffer[];
  trailer: PlaybackSource | null;
};

export interface PlaybackProvider {
  id: string;
  name: string;
  type: ProviderKind;
  isAvailable(movieId: number, region: string): Promise<boolean>;
  getSource(movieId: number, region: string): Promise<PlaybackSource | null>;
}
