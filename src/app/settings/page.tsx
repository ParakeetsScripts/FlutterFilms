"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { FEATURED_GENRES, LANGUAGES, REGIONS } from "@/lib/regions";
import { THEMES, type AppTheme } from "@/lib/themes";
import Link from "next/link";

export default function SettingsPage() {
  const { settings, updateSettings, clearHistory, clearPersonalization } = useUserLibrary();

  function toggleGenre(id: number) {
    const next = settings.favoriteGenres.includes(id)
      ? settings.favoriteGenres.filter((genreId) => genreId !== id)
      : [...settings.favoriteGenres, id];
    updateSettings({ favoriteGenres: next });
  }

  function toggleLanguage(code: string) {
    const next = settings.preferredLanguages.includes(code)
      ? settings.preferredLanguages.filter((item) => item !== code)
      : [...settings.preferredLanguages, code];
    updateSettings({ preferredLanguages: next });
  }

  return (
    <div className="page-container page-section max-w-2xl">
      <header className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Preferences</p>
            <h1 className="page-header__title">Settings</h1>
            <p className="page-header__subtitle">
              Watchlist, favorites, and history stay on this device unless you sign in later.
            </p>
          </div>
          <Link href="/capabilities" className="btn btn-ghost" aria-label="Platform capabilities">
            ⚙ Platform
          </Link>
        </div>
      </header>
      <div className="space-y-8">
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Theme</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choose from {THEMES.length} cinematic palettes. Theme selection lives here — not in the header.
          </p>
          <div className="theme-picker mt-4">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`theme-picker__option ${settings.theme === theme.id ? "is-selected" : ""}`}
                onClick={() => updateSettings({ theme: theme.id as AppTheme })}
              >
                <div className={`theme-picker__preview theme-picker__preview--${theme.id}`} />
                <span className="text-sm font-medium">{theme.label}</span>
                <span className="text-xs text-[var(--muted)]">{theme.description}</span>
              </button>
            ))}
          </div>
        </section>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Watch region</span>
          <select
            value={settings.region}
            onChange={(event) => updateSettings({ region: event.target.value })}
            className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          >
            {REGIONS.map((region) => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Catalog language</span>
          <select
            value={settings.language}
            onChange={(event) => updateSettings({ language: event.target.value })}
            className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>{language.name}</option>
            ))}
          </select>
        </label>

        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Favorite genres</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {FEATURED_GENRES.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`filter-chip ${settings.favoriteGenres.includes(genre.id) ? "is-active" : ""}`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Preferred languages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => toggleLanguage(language.code)}
                className={`filter-chip ${settings.preferredLanguages.includes(language.code) ? "is-active" : ""}`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">AI Cinema</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["none", "light", "moderate", "full"] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={`filter-chip ${settings.spoilerLevel === level ? "is-active" : ""}`}
                onClick={() => updateSettings({ spoilerLevel: level })}
              >
                Spoiler shield: {level}
              </button>
            ))}
          </div>
        </section>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.agentMode}
            onChange={(event) => updateSettings({ agentMode: event.target.checked })}
          />
          Cinema Agent Mode
        </label>
        <p className="text-xs text-[var(--text-muted)] -mt-4 ml-7">
          Persistent agent memory across Copilot — preferences, goals, and watch context.
        </p>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.privateMode}
            onChange={(event) => updateSettings({ privateMode: event.target.checked })}
          />
          Private Mode (self-hosted AI only)
        </label>
        <p className="text-xs text-[var(--text-muted)] -mt-4 ml-7">
          Your conversation stays on your configured AI infrastructure. Privacy depends on your server setup.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.disablePersonalizedRows}
            onChange={(event) => updateSettings({ disablePersonalizedRows: event.target.checked })}
          />
          Disable personalized rows
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.tvMode}
            onChange={(event) => updateSettings({ tvMode: event.target.checked })}
          />
          TV mode
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(event) => updateSettings({ reduceMotion: event.target.checked })}
          />
          Reduce motion
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoplayTrailers}
            onChange={(event) => updateSettings({ autoplayTrailers: event.target.checked })}
          />
          Autoplay trailers
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={clearHistory} className="btn btn-secondary">
            Clear history
          </button>
          <button type="button" onClick={clearPersonalization} className="btn btn-ghost">
            Clear personalization
          </button>
        </div>

        <p className="text-sm text-[var(--muted)]">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </div>
  );
}
