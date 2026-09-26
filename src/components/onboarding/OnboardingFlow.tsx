"use client";

import { MovieTasteSearch } from "@/components/onboarding/MovieTasteSearch";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PersonTasteSearch } from "@/components/onboarding/PersonTasteSearch";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LANGUAGES } from "@/lib/regions";
import { MAX_FAVORITE_MOVIES, MIN_FAVORITE_MOVIES } from "@/lib/onboarding/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function OnboardingFlow() {
  const {
    state,
    ready,
    saving,
    saveError,
    canContinue,
    minMovies,
    addMovie,
    removeMovie,
    toggleGenre,
    addPerson,
    removePerson,
    toggleLanguage,
    setStep,
    update,
    complete,
    existingFavorites,
  } = useOnboarding();

  const [genres, setGenres] = useState<Array<{ id: number; name: string }>>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ movies: number; genres: number; people: number; languages: number } | null>(null);

  useEffect(() => {
    void fetch("/api/onboarding/genres")
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => {});
  }, []);

  if (!ready) {
    return <p className="onboarding-hint page-container page-section">Loading your taste profile…</p>;
  }

  if (state.completed || done) {
    return (
      <div className="page-container page-section max-w-2xl onboarding-complete">
        <header className="page-header">
          <h1 className="page-header__title">Your cinema profile is ready</h1>
          <p className="page-header__subtitle">FlutterFilms can now personalize your discovery.</p>
        </header>
        <div className="ai-usage-card space-y-3">
          <p><strong>{summary?.movies ?? state.favoriteMovies.length}</strong> favorite movies</p>
          <p><strong>{summary?.genres ?? state.favoriteGenres.length}</strong> favorite genres</p>
          <p><strong>{summary?.people ?? state.favoritePeople.length}</strong> favorite filmmakers</p>
          <p><strong>{summary?.languages ?? state.preferredLanguages.length}</strong> languages</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/my-cinema" className="btn btn-primary">Explore my cinema</Link>
            <Link href="/" className="btn btn-secondary">Go home</Link>
          </div>
        </div>
      </div>
    );
  }

  const step = state.step;
  const maxMoviesReached = state.favoriteMovies.length >= MAX_FAVORITE_MOVIES;

  async function handleComplete() {
    const result = await complete();
    if (result?.summary) {
      setSummary(result.summary);
      setDone(true);
    }
  }

  return (
    <div className="page-container page-section max-w-4xl onboarding-flow">
      <OnboardingProgress step={step} />
      <header className="page-header">
        <h1 className="page-header__title">
          {step === 0 && "Welcome to FlutterFilms"}
          {step === 1 && "What movies do you love?"}
          {step === 2 && "Pick your genres"}
          {step === 3 && "Favorite filmmakers"}
          {step === 4 && "Languages & discovery"}
          {step === 5 && "Review your taste"}
        </h1>
        <p className="page-header__subtitle">
          {step === 0 && "Tell us what you love — we'll personalize everything from real TMDB data."}
          {step === 1 && `Search and select at least ${minMovies} movies. (${state.favoriteMovies.length}/${MAX_FAVORITE_MOVIES})`}
          {step === 2 && "Choose genres that match your taste."}
          {step === 3 && "Optional — search directors, actors, or writers."}
          {step === 4 && "How should FlutterFilms discover for you?"}
          {step === 5 && "Confirm before we build your profile."}
        </p>
      </header>

      {existingFavorites > 0 && step === 0 && (
        <div className="ai-usage-card mb-6 text-sm">
          You already have {existingFavorites} favorites. Onboarding will add to your taste — nothing is overwritten without your choices.
        </div>
      )}

      {step === 0 && (
        <div className="ai-usage-card">
          <p className="text-sm text-[var(--text-secondary)]">
            This takes about 2 minutes. Your selections sync when signed in and stay on this device as a draft.
          </p>
        </div>
      )}

      {step === 1 && (
        <MovieTasteSearch
          selected={state.favoriteMovies}
          onSelect={addMovie}
          onRemove={removeMovie}
          maxReached={maxMoviesReached}
        />
      )}

      {step === 2 && (
        <div className="ai-usage-card flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`filter-chip ${state.favoriteGenres.includes(g.id) ? "is-active" : ""}`}
              aria-pressed={state.favoriteGenres.includes(g.id)}
              onClick={() => toggleGenre(g.id)}
            >
              {g.name}
              {state.favoriteGenres.includes(g.id) ? " ✓" : ""}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <PersonTasteSearch selected={state.favoritePeople} onSelect={addPerson} onRemove={removePerson} />
      )}

      {step === 4 && (
        <div className="ai-usage-card space-y-6">
          <div>
            <h3 className="section-title text-base">Preferred languages</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`filter-chip ${state.preferredLanguages.includes(lang.code) ? "is-active" : ""}`}
                  aria-pressed={state.preferredLanguages.includes(lang.code)}
                  onClick={() => toggleLanguage(lang.code)}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="text-xs uppercase text-[var(--muted)]">Familiar or different?</span>
              <select
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                value={state.discoveryPreferences.familiarity}
                onChange={(e) =>
                  update({
                    discoveryPreferences: {
                      ...state.discoveryPreferences,
                      familiarity: e.target.value as "familiar" | "different",
                    },
                  })
                }
              >
                <option value="familiar">Familiar picks</option>
                <option value="different">Something different</option>
              </select>
            </label>
            <label>
              <span className="text-xs uppercase text-[var(--muted)]">Energy</span>
              <select
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                value={state.discoveryPreferences.energy}
                onChange={(e) =>
                  update({
                    discoveryPreferences: {
                      ...state.discoveryPreferences,
                      energy: e.target.value as "low" | "balanced" | "high",
                    },
                  })
                }
              >
                <option value="low">Low energy</option>
                <option value="balanced">Balanced</option>
                <option value="high">High energy</option>
              </select>
            </label>
            <label>
              <span className="text-xs uppercase text-[var(--muted)]">Discovery scope</span>
              <select
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                value={state.discoveryPreferences.scope}
                onChange={(e) =>
                  update({
                    discoveryPreferences: {
                      ...state.discoveryPreferences,
                      scope: e.target.value as "mainstream" | "niche" | "balanced",
                    },
                  })
                }
              >
                <option value="mainstream">Mainstream</option>
                <option value="balanced">Balanced</option>
                <option value="niche">Hidden gems</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="ai-usage-card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-medium">Favorite movies</h3>
              <p className="text-2xl font-serif">{state.favoriteMovies.length}</p>
              <button type="button" className="btn btn-ghost text-sm mt-2" onClick={() => setStep(1)}>Edit</button>
            </div>
            <div>
              <h3 className="font-medium">Genres</h3>
              <p className="text-2xl font-serif">{state.favoriteGenres.length}</p>
              <button type="button" className="btn btn-ghost text-sm mt-2" onClick={() => setStep(2)}>Edit</button>
            </div>
            <div>
              <h3 className="font-medium">Filmmakers</h3>
              <p className="text-2xl font-serif">{state.favoritePeople.length}</p>
              <button type="button" className="btn btn-ghost text-sm mt-2" onClick={() => setStep(3)}>Edit</button>
            </div>
            <div>
              <h3 className="font-medium">Languages</h3>
              <p className="text-2xl font-serif">{state.preferredLanguages.length}</p>
              <button type="button" className="btn btn-ghost text-sm mt-2" onClick={() => setStep(4)}>Edit</button>
            </div>
          </div>
          {state.favoriteMovies.length < MIN_FAVORITE_MOVIES && (
            <p className="onboarding-error">Select at least {MIN_FAVORITE_MOVIES} movies to continue.</p>
          )}
          {saveError && <p className="onboarding-error">{saveError}</p>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || state.favoriteMovies.length < MIN_FAVORITE_MOVIES}
            onClick={handleComplete}
          >
            {saving ? "Building your cinema profile…" : "Save my taste"}
          </button>
        </div>
      )}

      <div className="onboarding-nav mt-8 flex flex-wrap gap-3">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 5 && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={step > 0 && !canContinue}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </button>
        )}
        {step === 0 && (
          <Link href="/" className="btn btn-ghost">Skip for now</Link>
        )}
      </div>
    </div>
  );
}
