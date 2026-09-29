import type { UserSettings } from "@/lib/user/store";

export type CatalogPreferences = {
  uiLanguage: string;
  originalLanguage?: string;
  region: string;
};

const CATALOG_COOKIE = "ff_catalog";

export function catalogFromSettings(settings: Partial<UserSettings>): CatalogPreferences {
  const uiLanguage = settings.language?.trim() || "en";
  const region = settings.region?.trim() || "US";
  const preferred = settings.preferredLanguages?.filter(Boolean) ?? [];

  let originalLanguage: string | undefined;
  if (uiLanguage !== "en") {
    originalLanguage = uiLanguage;
  } else if (preferred.length === 1) {
    originalLanguage = preferred[0];
  } else if (preferred.length > 1) {
    originalLanguage = preferred[0];
  }

  return { uiLanguage, originalLanguage, region };
}

export function serializeCatalogCookie(prefs: CatalogPreferences): string {
  return encodeURIComponent(JSON.stringify(prefs));
}

export function parseCatalogCookie(raw: string | undefined | null): CatalogPreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<CatalogPreferences>;
    if (!parsed.uiLanguage) return null;
    return {
      uiLanguage: parsed.uiLanguage,
      originalLanguage: parsed.originalLanguage,
      region: parsed.region ?? "US",
    };
  } catch {
    return null;
  }
}

export function catalogCookieName() {
  return CATALOG_COOKIE;
}

export const defaultCatalogPreferences: CatalogPreferences = {
  uiLanguage: "en",
  region: "US",
};
