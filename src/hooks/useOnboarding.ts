"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import { onboardingStore } from "@/lib/onboarding/store";
import {
  MAX_FAVORITE_MOVIES,
  MIN_FAVORITE_GENRES,
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
    let settled = false;
    const finish = (next: OnboardingState) => {
      if (settled) return;
      settled = true;
      setState(next);
      onboardingStore.write(next);
      setReady(true);
    };

    const timeout = window.setTimeout(() => finish(local), 4000);
    const controller = new AbortController();

    void fetch("/api/onboarding/state", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const server = data.state as OnboardingState | undefined;
        const merged = server?.favoriteMovies?.length
          ? { ...defaultOnboardingState(), ...local, ...server }
          : { ...defaultOnboardingState(), ...server, ...local };
        if (!merged.completed) track("onboarding_started");
        finish(merged);
      })
      .catch(() => finish(local))
      .finally(() => {
        window.clearTimeout(timeout);
        controller.abort();
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
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

  const finishLocally = useCallback(() => {
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
    return {
      summary: {
        movies: state.favoriteMovies.length,
        genres: state.favoriteGenres.length,
        people: state.favoritePeople.length,
        languages: state.preferredLanguages.length,
      },
    };
  }, [state, update, updateSettings, setFavoriteIds]);

  const complete = useCallback(async () => {
    setSaving(true);
    setSaveError(null);

    if (state.favoriteMovies.length < MIN_FAVORITE_MOVIES) {
      setSaveError(`Select at least ${MIN_FAVORITE_MOVIES} movies to continue.`);
      setSaving(false);
      return null;
    }
    if (state.favoriteGenres.length < MIN_FAVORITE_GENRES) {
      setSaveError(`Select at least ${MIN_FAVORITE_GENRES} genre.`);
      setSaving(false);
      return null;
    }
    if (!state.preferredLanguages.length) {
      setSaveError("Select at least one language.");
      setSaving(false);
      return null;
    }

    const result = finishLocally();

    void fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    }).catch(() => {});

    track("onboarding_completed", {
      movies: state.favoriteMovies.length,
      genres: state.favoriteGenres.length,
      people: state.favoritePeople.length,
      signedIn: Boolean(user),
    });
    setSaving(false);
    return result;
  }, [state, user, finishLocally]);

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
