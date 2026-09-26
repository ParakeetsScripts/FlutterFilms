"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import { onboardingStore } from "@/lib/onboarding/store";
import {
  MAX_FAVORITE_MOVIES,
  MIN_FAVORITE_MOVIES,
  type MovieTasteItem,
  type OnboardingState,
  type PersonTasteItem,
  canAdvanceFromStep,
  defaultOnboardingState,
} from "@/lib/onboarding/types";
import { useCallback, useEffect, useRef, useState } from "react";

export function useOnboarding() {
  const { user } = useAuth();
  const { updateSettings, setFavoriteIds, favorites } = useUserLibrary();
  const [state, setState] = useState<OnboardingState>(defaultOnboardingState);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: OnboardingState) => {
      onboardingStore.write(next);
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        void fetch("/api/onboarding/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: next }),
        });
      }, 600);
    },
    [],
  );

  const update = useCallback(
    (patch: Partial<OnboardingState> | ((prev: OnboardingState) => OnboardingState)) => {
      setState((prev) => {
        const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  useEffect(() => {
    const local = onboardingStore.read();
    void fetch("/api/onboarding/state")
      .then((r) => r.json())
      .then((data) => {
        const server = data.state as OnboardingState | undefined;
        const merged = server?.favoriteMovies?.length
          ? { ...defaultOnboardingState(), ...local, ...server }
          : { ...defaultOnboardingState(), ...server, ...local };
        setState(merged);
        onboardingStore.write(merged);
        if (!merged.completed) track("onboarding_started");
      })
      .catch(() => setState(local))
      .finally(() => setReady(true));
  }, []);

  const addMovie = useCallback(
    (movie: MovieTasteItem) => {
      if (state.favoriteMovies.some((m) => m.tmdbId === movie.tmdbId)) return false;
      if (state.favoriteMovies.length >= MAX_FAVORITE_MOVIES) return false;
      update((prev) => ({
        ...prev,
        favoriteMovies: [...prev.favoriteMovies, { ...movie, id: movie.tmdbId }],
      }));
      track("onboarding_movie_selected", { movieId: movie.tmdbId });
      return true;
    },
    [state.favoriteMovies, update],
  );

  const removeMovie = useCallback(
    (tmdbId: number) => {
      update((prev) => ({
        ...prev,
        favoriteMovies: prev.favoriteMovies.filter((m) => m.tmdbId !== tmdbId),
      }));
      track("onboarding_movie_removed", { movieId: tmdbId });
    },
    [update],
  );

  const toggleGenre = useCallback(
    (genreId: number) => {
      update((prev) => {
        const has = prev.favoriteGenres.includes(genreId);
        const favoriteGenres = has
          ? prev.favoriteGenres.filter((id) => id !== genreId)
          : [...prev.favoriteGenres, genreId];
        if (!has) track("onboarding_genre_selected", { genreId });
        return { ...prev, favoriteGenres };
      });
    },
    [update],
  );

  const addPerson = useCallback(
    (person: PersonTasteItem) => {
      if (state.favoritePeople.some((p) => p.id === person.id)) return false;
      update((prev) => ({ ...prev, favoritePeople: [...prev.favoritePeople, person] }));
      track("onboarding_person_selected", { personId: person.id });
      return true;
    },
    [state.favoritePeople, update],
  );

  const removePerson = useCallback(
    (personId: number) => {
      update((prev) => ({
        ...prev,
        favoritePeople: prev.favoritePeople.filter((p) => p.id !== personId),
      }));
    },
    [update],
  );

  const toggleLanguage = useCallback(
    (code: string) => {
      update((prev) => {
        const has = prev.preferredLanguages.includes(code);
        const preferredLanguages = has
          ? prev.preferredLanguages.filter((l) => l !== code)
          : [...prev.preferredLanguages, code];
        return { ...prev, preferredLanguages: preferredLanguages.length ? preferredLanguages : prev.preferredLanguages };
      });
    },
    [update],
  );

  const setStep = useCallback(
    (step: number) => {
      update((prev) => ({ ...prev, step }));
      track("onboarding_step_completed", { step });
    },
    [update],
  );

  const complete = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setSaveError(data.error ?? "Could not save your taste profile.");
        track("onboarding_save_failed");
        return null;
      }
      const movieIds = state.favoriteMovies.map((m) => m.tmdbId);
      setFavoriteIds(movieIds);
      updateSettings({
        favoriteGenres: state.favoriteGenres,
        preferredLanguages: state.preferredLanguages,
        onboardingCompleted: true,
        onboardingVersion: state.version,
        discoveryPreferences: state.discoveryPreferences,
      });
      update({ completed: true, completedAt: new Date().toISOString() });
      track("onboarding_completed", {
        movies: state.favoriteMovies.length,
        genres: state.favoriteGenres.length,
        people: state.favoritePeople.length,
        signedIn: Boolean(user),
      });
      return data;
    } catch {
      setSaveError("Network error — your selections are saved locally. Try again.");
      track("onboarding_save_failed");
      return null;
    } finally {
      setSaving(false);
    }
  }, [state, update, updateSettings, setFavoriteIds, user]);

  return {
    state,
    ready,
    saving,
    saveError,
    canContinue: canAdvanceFromStep(state, state.step),
    minMovies: MIN_FAVORITE_MOVIES,
    maxMovies: MAX_FAVORITE_MOVIES,
    addMovie,
    removeMovie,
    toggleGenre,
    addPerson,
    removePerson,
    toggleLanguage,
    setStep,
    update,
    complete,
    existingFavorites: favorites.length,
  };
}
