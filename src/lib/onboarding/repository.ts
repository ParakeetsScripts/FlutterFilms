import "server-only";

import { getDatabase } from "@/lib/db/client";
import { defaultOnboardingState, type OnboardingState } from "./types";

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const db = await getDatabase();
  const prefs = await db.get<{ settings_json: string }>("SELECT settings_json FROM user_preferences WHERE user_id = ?", [
    userId,
  ]);
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(String(prefs?.settings_json ?? "{}"));
  } catch {
    settings = {};
  }
  const stored = settings.onboarding as Partial<OnboardingState> | undefined;
  if (stored && typeof stored === "object") {
    return { ...defaultOnboardingState(), ...stored };
  }
  return defaultOnboardingState();
}

export async function saveOnboardingDraft(userId: string, state: OnboardingState) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const prefs = await db.get<{ settings_json: string }>("SELECT settings_json FROM user_preferences WHERE user_id = ?", [
    userId,
  ]);
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(String(prefs?.settings_json ?? "{}"));
  } catch {
    settings = {};
  }
  settings.onboarding = state;
  await db.run(
    `INSERT INTO user_preferences (user_id, settings_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at`,
    [userId, JSON.stringify(settings), now],
  );
}
