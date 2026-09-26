export type ProviderLegalStatus = "official_api" | "attribution_feed" | "requires_authorization" | "local_only";

export type ProviderConfig = {
  id: string;
  displayName: string;
  baseUrl?: string;
  apiBaseUrl?: string;
  authType: "none" | "bearer" | "local";
  enabled: boolean;
  regions: string[];
  legalStatus: ProviderLegalStatus;
  lastVerified: string | null;
  notes: string;
};

export const providerConfigs: ProviderConfig[] = [
  {
    id: "tmdb",
    displayName: "TMDB Metadata",
    baseUrl: "https://www.themoviedb.org",
    apiBaseUrl: "https://api.themoviedb.org/3",
    authType: "bearer",
    enabled: true,
    regions: ["*"],
    legalStatus: "official_api",
    lastVerified: "2026-09-25",
    notes: "Official metadata, images, credits, videos, and recommendations.",
  },
  {
    id: "justwatch-via-tmdb",
    displayName: "JustWatch via TMDB",
    baseUrl: "https://www.justwatch.com",
    authType: "none",
    enabled: true,
    regions: ["*"],
    legalStatus: "attribution_feed",
    lastVerified: "2026-09-25",
    notes: "Regional streaming/rent/buy availability. Requires JustWatch attribution.",
  },
  {
    id: "youtube-trailer",
    displayName: "Official trailers",
    baseUrl: "https://www.youtube.com",
    authType: "none",
    enabled: true,
    regions: ["*"],
    legalStatus: "official_api",
    lastVerified: "2026-09-25",
    notes: "YouTube keys supplied by TMDB video metadata.",
  },
  {
    id: "local-media",
    displayName: "User-owned media",
    authType: "local",
    enabled: true,
    regions: ["*"],
    legalStatus: "local_only",
    lastVerified: "2026-09-25",
    notes: "Local files stay on the user's device. Never uploaded by default.",
  },
  {
    id: "einthusan",
    displayName: "Einthusan",
    baseUrl: "https://einthusan.tv",
    authType: "none",
    enabled: false,
    regions: [],
    legalStatus: "requires_authorization",
    lastVerified: null,
    notes:
      "Enable only after verifying official API access, permission, and lawful playback/deep-link terms. Do not scrape, extract hidden URLs, bypass the player, or proxy streams.",
  },
];

export function getEnabledProviders() {
  return providerConfigs.filter((provider) => provider.enabled);
}

export function getProvider(id: string) {
  return providerConfigs.find((provider) => provider.id === id) ?? null;
}
