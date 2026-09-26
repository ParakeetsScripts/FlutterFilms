import {
  MAX_FAVORITE_MOVIES,
  MAX_FAVORITE_PEOPLE,
  MIN_FAVORITE_GENRES,
  MIN_FAVORITE_MOVIES,
  ONBOARDING_VERSION,
  type DiscoveryPreferences,
  type MovieTasteItem,
  type OnboardingState,
  type PersonTasteItem,
} from "./types";

function isMovieItem(value: unknown): value is MovieTasteItem {
  if (!value || typeof value !== "object") return false;
  const m = value as MovieTasteItem;
  return typeof m.tmdbId === "number" && typeof m.title === "string";
}

function isPersonItem(value: unknown): value is PersonTasteItem {
  if (!value || typeof value !== "object") return false;
  const p = value as PersonTasteItem;
  return typeof p.id === "number" && typeof p.name === "string";
}

export function sanitizeOnboardingPayload(raw: unknown): OnboardingState | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Partial<OnboardingState>;
  const movies = Array.isArray(body.favoriteMovies) ? body.favoriteMovies.filter(isMovieItem) : [];
  const genres = Array.isArray(body.favoriteGenres)
    ? body.favoriteGenres.filter((g): g is number => typeof g === "number")
    : [];
  const people = Array.isArray(body.favoritePeople) ? body.favoritePeople.filter(isPersonItem) : [];
  const languages = Array.isArray(body.preferredLanguages)
    ? body.preferredLanguages.filter((l): l is string => typeof l === "string" && l.length <= 8)
    : ["en"];

  const discovery = body.discoveryPreferences as DiscoveryPreferences | undefined;
  const discoveryPreferences: DiscoveryPreferences = {
    familiarity: discovery?.familiarity === "different" ? "different" : "familiar",
    energy: discovery?.energy === "low" || discovery?.energy === "high" ? discovery.energy : "balanced",
    scope: discovery?.scope === "mainstream" || discovery?.scope === "niche" ? discovery.scope : "balanced",
  };

  const uniqueMovies: MovieTasteItem[] = [];
  const seenMovies = new Set<number>();
  for (const m of movies.slice(0, MAX_FAVORITE_MOVIES)) {
    if (seenMovies.has(m.tmdbId)) continue;
    seenMovies.add(m.tmdbId);
    uniqueMovies.push({ ...m, id: m.tmdbId });
  }

  const uniquePeople: PersonTasteItem[] = [];
  const seenPeople = new Set<number>();
  for (const p of people.slice(0, MAX_FAVORITE_PEOPLE)) {
    if (seenPeople.has(p.id)) continue;
    seenPeople.add(p.id);
    uniquePeople.push(p);
  }

  return {
    version: ONBOARDING_VERSION,
    step: typeof body.step === "number" ? Math.min(5, Math.max(0, body.step)) : 0,
    completed: false,
    completedAt: null,
    favoriteMovies: uniqueMovies,
    favoriteGenres: [...new Set(genres)].slice(0, 12),
    favoritePeople: uniquePeople,
    preferredLanguages: [...new Set(languages)].slice(0, 6),
    discoveryPreferences,
  };
}

export function validateOnboardingComplete(state: OnboardingState): string | null {
  if (state.favoriteMovies.length < MIN_FAVORITE_MOVIES) {
    return `Select at least ${MIN_FAVORITE_MOVIES} movies.`;
  }
  if (state.favoriteGenres.length < MIN_FAVORITE_GENRES) {
    return `Select at least ${MIN_FAVORITE_GENRES} genre.`;
  }
  if (!state.preferredLanguages.length) {
    return "Select at least one language.";
  }
  return null;
}
