export const ONBOARDING_VERSION = 2;
export const MIN_FAVORITE_MOVIES = 3;
export const MAX_FAVORITE_MOVIES = 20;
export const RECOMMENDED_MOVIES = 5;
export const MIN_FAVORITE_GENRES = 1;
export const MAX_FAVORITE_PEOPLE = 12;

export type MovieTasteItem = {
  id: number;
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  originalTitle?: string | null;
};

export type PersonTasteItem = {
  id: number;
  name: string;
  profilePath: string | null;
  knownFor: string | null;
  department: string | null;
};

export type DiscoveryPreferences = {
  familiarity: "familiar" | "different";
  energy: "low" | "balanced" | "high";
  scope: "mainstream" | "niche" | "balanced";
};

export type OnboardingState = {
  version: number;
  step: number;
  completed: boolean;
  completedAt: string | null;
  favoriteMovies: MovieTasteItem[];
  favoriteGenres: number[];
  favoritePeople: PersonTasteItem[];
  preferredLanguages: string[];
  discoveryPreferences: DiscoveryPreferences;
};

export const defaultDiscoveryPreferences: DiscoveryPreferences = {
  familiarity: "familiar",
  energy: "balanced",
  scope: "balanced",
};

export function defaultOnboardingState(): OnboardingState {
  return {
    version: ONBOARDING_VERSION,
    step: 0,
    completed: false,
    completedAt: null,
    favoriteMovies: [],
    favoriteGenres: [],
    favoritePeople: [],
    preferredLanguages: ["en"],
    discoveryPreferences: defaultDiscoveryPreferences,
  };
}

export function canAdvanceFromStep(state: OnboardingState, step: number): boolean {
  switch (step) {
    case 0:
      return true;
    case 1:
      return state.favoriteMovies.length >= MIN_FAVORITE_MOVIES;
    case 2:
      return state.favoriteGenres.length >= MIN_FAVORITE_GENRES;
    case 3:
      return true;
    case 4:
      return state.preferredLanguages.length >= 1;
    case 5:
      return state.favoriteMovies.length >= MIN_FAVORITE_MOVIES;
    default:
      return false;
  }
}
