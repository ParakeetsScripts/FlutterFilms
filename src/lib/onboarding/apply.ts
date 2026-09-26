import "server-only";

import { upsertTasteSignal, saveTasteSnapshot } from "@/lib/user/taste-repository";
import { getDatabase } from "@/lib/db/client";
import type { OnboardingState } from "./types";
import { ONBOARDING_VERSION } from "./types";

export async function applyOnboardingToUser(userId: string, state: OnboardingState) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const movieIds = state.favoriteMovies.map((m) => m.tmdbId);
  const genreIds = state.favoriteGenres;
  const peopleIds = state.favoritePeople.map((p) => p.id);
  const languages = state.preferredLanguages;

  await db.run("DELETE FROM user_favorites WHERE user_id = ?", [userId]);
  for (const movieId of movieIds) {
    await db.run("INSERT INTO user_favorites (user_id, movie_id, added_at) VALUES (?, ?, ?)", [userId, movieId, now]);
  }

  await db.run(
    `UPDATE users SET
      favorite_genres_json = ?,
      favorite_languages_json = ?,
      favorite_people_json = ?,
      updated_at = ?
     WHERE id = ?`,
    [JSON.stringify(genreIds), JSON.stringify(languages), JSON.stringify(peopleIds), now, userId],
  );

  const prefs = await db.get<{ settings_json: string }>("SELECT settings_json FROM user_preferences WHERE user_id = ?", [
    userId,
  ]);
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(String(prefs?.settings_json ?? "{}"));
  } catch {
    settings = {};
  }

  settings.favoriteGenres = genreIds;
  settings.preferredLanguages = languages;
  settings.favoritePeople = peopleIds;
  settings.discoveryPreferences = state.discoveryPreferences;
  settings.onboardingCompleted = true;
  settings.onboardingVersion = ONBOARDING_VERSION;
  settings.onboardingCompletedAt = now;
  settings.onboarding = {
    ...state,
    completed: true,
    completedAt: now,
    version: ONBOARDING_VERSION,
  };

  await db.run(
    `INSERT INTO user_preferences (user_id, settings_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at`,
    [userId, JSON.stringify(settings), now],
  );

  for (const movie of state.favoriteMovies) {
    await upsertTasteSignal(userId, {
      signalKey: "favorite_movie",
      signalValue: String(movie.tmdbId),
      weight: 2,
      source: "onboarding",
    });
  }
  for (const genreId of genreIds) {
    await upsertTasteSignal(userId, {
      signalKey: "genre",
      signalValue: String(genreId),
      weight: 1.5,
      source: "onboarding",
    });
  }
  for (const person of state.favoritePeople) {
    await upsertTasteSignal(userId, {
      signalKey: "person",
      signalValue: String(person.id),
      weight: 1.5,
      source: "onboarding",
    });
  }
  for (const lang of languages) {
    await upsertTasteSignal(userId, {
      signalKey: "language",
      signalValue: lang,
      weight: 1,
      source: "onboarding",
    });
  }

  await saveTasteSnapshot(userId, {
    source: "onboarding",
    version: ONBOARDING_VERSION,
    movieCount: movieIds.length,
    genreCount: genreIds.length,
    peopleCount: peopleIds.length,
    languages,
    discovery: state.discoveryPreferences,
    movieIds,
    genreIds,
    peopleIds,
  });
}
