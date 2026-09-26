"use client";

import { migrateTheme, type AppTheme } from "@/lib/themes";

export type WatchlistItem = { movieId: number; addedAt: string; position: number };
export type FavoriteItem = { movieId: number; addedAt: string };
export type HistoryItem = { movieId: number; viewedAt: string };
export type ContinueItem = {
  movieId: number;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: string;
  kind: "movie" | "trailer";
};
export type LibraryItem = {
  movieId: number;
  filename: string;
  playbackUrl?: string;
  addedAt: string;
};
export type DiscoveryPreferences = {
  familiarity: "familiar" | "different";
  energy: "low" | "balanced" | "high";
  scope: "mainstream" | "niche" | "balanced";
};

export type UserSettings = {
  region: string;
  language: string;
  theme: AppTheme;
  autoplayTrailers: boolean;
  reduceMotion: boolean;
  imageQuality: "standard" | "high";
  tvMode: boolean;
  favoriteGenres: number[];
  preferredLanguages: string[];
  favoriteDecades: number[];
  favoritePeople: number[];
  discoveryPreferences: DiscoveryPreferences;
  onboardingCompleted: boolean;
  onboardingVersion: number;
  disablePersonalizedRows: boolean;
  privateMode: boolean;
  spoilerLevel: "none" | "light" | "moderate" | "full";
  agentMode: boolean;
};

const KEYS = {
  watchlist: "vita.watchlist",
  favorites: "vita.favorites",
  history: "vita.history",
  continue: "vita.continue",
  searches: "vita.searches",
  settings: "vita.settings",
  library: "vita.library",
  interview: "vita.interview",
  agent: "vita.agent",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const defaultSettings: UserSettings = {
  region: "US",
  language: "en",
  theme: "noir",
  autoplayTrailers: false,
  reduceMotion: false,
  imageQuality: "standard",
  tvMode: false,
  favoriteGenres: [],
  preferredLanguages: [],
  favoriteDecades: [],
  favoritePeople: [],
  discoveryPreferences: { familiarity: "familiar", energy: "balanced", scope: "balanced" },
  onboardingCompleted: false,
  onboardingVersion: 0,
  disablePersonalizedRows: false,
  privateMode: false,
  spoilerLevel: "none",
  agentMode: true,
};

export type InterviewProfile = {
  mood: string;
  genres: string;
  runtimePreference: string;
  attention: string;
  decades: string;
  languages: string;
  intensity: string;
  discoveryStyle: string;
  summary: string;
  createdAt: string;
};

export type AgentMemory = {
  goals: string[];
  dislikes: string[];
  favoriteFilmmakers: string[];
  unfinishedLists: string[];
  notes: string[];
};

export const userStore = {
  watchlist: () => read<WatchlistItem[]>(KEYS.watchlist, []),
  setWatchlist: (items: WatchlistItem[]) => write(KEYS.watchlist, items),
  favorites: () => read<FavoriteItem[]>(KEYS.favorites, []),
  setFavorites: (items: FavoriteItem[]) => write(KEYS.favorites, items),
  history: () => read<HistoryItem[]>(KEYS.history, []),
  setHistory: (items: HistoryItem[]) => write(KEYS.history, items),
  continueWatching: () => read<ContinueItem[]>(KEYS.continue, []),
  setContinueWatching: (items: ContinueItem[]) => write(KEYS.continue, items),
  searches: () => read<string[]>(KEYS.searches, []),
  setSearches: (items: string[]) => write(KEYS.searches, items),
  settings: () => {
    const partial = read<Partial<UserSettings>>(KEYS.settings, {});
    const merged = { ...defaultSettings, ...partial };
    merged.theme = migrateTheme(merged.theme);
    return merged;
  },
  setSettings: (settings: UserSettings) => write(KEYS.settings, settings),
  library: () => read<LibraryItem[]>(KEYS.library, []),
  setLibrary: (items: LibraryItem[]) => write(KEYS.library, items),
  clearHistory() {
    write(KEYS.history, []);
  },
  clearPersonalization() {
    write(KEYS.history, []);
    write(KEYS.continue, []);
    write(KEYS.searches, []);
    const settings = userStore.settings();
    write(KEYS.settings, {
      ...settings,
      favoriteGenres: [],
      preferredLanguages: [],
      favoriteDecades: [],
      disablePersonalizedRows: true,
    });
  },
  upsertContinue(item: ContinueItem) {
    const items = userStore.continueWatching().filter((entry) => entry.movieId !== item.movieId);
    write(KEYS.continue, [item, ...items].slice(0, 12));
  },
  removeContinue(movieId: number) {
    write(
      KEYS.continue,
      userStore.continueWatching().filter((item) => item.movieId !== movieId),
    );
  },
  interviewProfile: () => read<InterviewProfile | null>(KEYS.interview, null),
  setInterviewProfile: (profile: InterviewProfile) => write(KEYS.interview, profile),
  agentMemory: () => read<AgentMemory>(KEYS.agent, { goals: [], dislikes: [], favoriteFilmmakers: [], unfinishedLists: [], notes: [] }),
  setAgentMemory: (memory: AgentMemory) => write(KEYS.agent, memory),
};
