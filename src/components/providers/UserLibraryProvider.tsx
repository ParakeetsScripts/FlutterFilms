"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { catalogCookieName, catalogFromSettings, serializeCatalogCookie } from "@/lib/catalog/preferences";
import { track } from "@/lib/analytics/track";
import { userStore, type ContinueItem, type UserSettings, defaultSettings } from "@/lib/user/store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type LibraryContext = {
  ready: boolean;
  watchlist: number[];
  favorites: number[];
  history: number[];
  continueWatching: ContinueItem[];
  searches: string[];
  settings: UserSettings;
  toggleWatchlist: (movieId: number) => void;
  toggleFavorite: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  isFavorite: (movieId: number) => boolean;
  recordHistory: (movieId: number) => void;
  clearHistory: () => void;
  clearPersonalization: () => void;
  addSearch: (query: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setFavoriteIds: (movieIds: number[]) => void;
  updateContinueWatching: (item: ContinueItem) => void;
  removeContinueWatching: (movieId: number) => void;
};

const Context = createContext<LibraryContext | null>(null);

function syncCatalogCookie(settings: UserSettings) {
  if (typeof document === "undefined") return;
  const prefs = catalogFromSettings(settings);
  document.cookie = `${catalogCookieName()}=${serializeCatalogCookie(prefs)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export function UserLibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const [searches, setSearches] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const historyRef = useRef(history);
  historyRef.current = history;

  const recordHistory = useCallback((movieId: number) => {
    if (historyRef.current[0] === movieId) return;
    const next = [movieId, ...historyRef.current.filter((id) => id !== movieId)].slice(0, 80);
    setHistory(next);
    userStore.setHistory(next.map((id) => ({ movieId: id, viewedAt: new Date().toISOString() })));
    track("movie_viewed", { movieId });
  }, []);

  const pushToServer = useCallback(async () => {
    if (!user) return;
    await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlist,
        favorites,
        history: history.map((movieId) => ({ movieId, viewedAt: new Date().toISOString() })),
        continueWatching,
        settings,
        mergeMode: "all",
      }),
    });
  }, [user, watchlist, favorites, history, continueWatching, settings]);

  useEffect(() => {
    setWatchlist(userStore.watchlist().sort((a, b) => a.position - b.position).map((item) => item.movieId));
    setFavorites(userStore.favorites().map((item) => item.movieId));
    setHistory(userStore.history().map((item) => item.movieId));
    setContinueWatching(userStore.continueWatching());
    setSearches(userStore.searches());
    const initialSettings = userStore.settings();
    setSettings(initialSettings);
    syncCatalogCookie(initialSettings);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!user || !ready) return;
    fetch("/api/user/sync")
      .then((r) => r.json())
      .then((data) => {
        if (!data.library) return;
        if (data.library.watchlist?.length) setWatchlist(data.library.watchlist);
        if (data.library.favorites?.length) setFavorites(data.library.favorites);
        if (data.library.history?.length) setHistory(data.library.history.map((h: { movieId: number }) => h.movieId));
      })
      .catch(() => {});
  }, [user, ready]);

  useEffect(() => {
    if (!user || !ready) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void pushToServer(), 2000);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [user, ready, watchlist, favorites, history, continueWatching, settings, pushToServer]);

  const value = useMemo<LibraryContext>(
    () => ({
      ready,
      watchlist,
      favorites,
      history,
      continueWatching,
      searches,
      settings,
      isInWatchlist: (movieId) => watchlist.includes(movieId),
      isFavorite: (movieId) => favorites.includes(movieId),
      toggleWatchlist(movieId) {
        const adding = !watchlist.includes(movieId);
        const next = adding ? [movieId, ...watchlist] : watchlist.filter((id) => id !== movieId);
        setWatchlist(next);
        userStore.setWatchlist(next.map((id, index) => ({ movieId: id, addedAt: new Date().toISOString(), position: index })));
        track(adding ? "watchlist_added" : "watchlist_removed", { movieId });
        if (adding) track("user_activated", { action: "watchlist_added" });
      },
      toggleFavorite(movieId) {
        const adding = !favorites.includes(movieId);
        const next = adding ? [movieId, ...favorites] : favorites.filter((id) => id !== movieId);
        setFavorites(next);
        userStore.setFavorites(next.map((id) => ({ movieId: id, addedAt: new Date().toISOString() })));
        if (adding) {
          track("favorite_added", { movieId });
          track("user_activated", { action: "favorite_added" });
        }
      },
      recordHistory,
      clearHistory() {
        setHistory([]);
        userStore.clearHistory();
      },
      clearPersonalization() {
        userStore.clearPersonalization();
        setHistory([]);
        setContinueWatching([]);
        setSearches([]);
        setSettings(userStore.settings());
      },
      addSearch(query) {
        const next = [query, ...searches.filter((item) => item !== query)].slice(0, 8);
        setSearches(next);
        userStore.setSearches(next);
      },
      updateSettings(partial) {
        const next = { ...settings, ...partial };
        setSettings(next);
        userStore.setSettings(next);
        syncCatalogCookie(next);
      },
      setFavoriteIds(movieIds) {
        setFavorites(movieIds);
        userStore.setFavorites(movieIds.map((id) => ({ movieId: id, addedAt: new Date().toISOString() })));
      },
      updateContinueWatching(item) {
        userStore.upsertContinue(item);
        setContinueWatching(userStore.continueWatching());
      },
      removeContinueWatching(movieId) {
        userStore.removeContinue(movieId);
        setContinueWatching(userStore.continueWatching());
      },
    }),
    [continueWatching, favorites, history, ready, recordHistory, searches, settings, watchlist],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUserLibrary() {
  const value = useContext(Context);
  if (!value) {
    throw new Error("useUserLibrary must be used within UserLibraryProvider");
  }
  return value;
}
