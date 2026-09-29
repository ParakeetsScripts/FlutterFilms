import { detectCapabilities, watchCapabilities } from "./capabilities";
import { DEFAULT_MOTION_PREFERENCES, type CinematicIntensity, type DeviceCapabilities } from "./mode";

/** External stores for `useSyncExternalStore`; snapshots are cached so references stay stable. */

let capabilities: DeviceCapabilities | null = null;

export function subscribeCapabilities(onChange: () => void): () => void {
  return watchCapabilities(() => {
    capabilities = detectCapabilities();
    onChange();
  });
}

export function getCapabilitiesSnapshot(): DeviceCapabilities | null {
  if (capabilities === null) capabilities = detectCapabilities();
  return capabilities;
}

export function getCapabilitiesServerSnapshot(): DeviceCapabilities | null {
  return null;
}

export type StoredMotionPreferences = { intensity: CinematicIntensity; performanceMode: boolean };

const STORAGE_KEY = "ff.motion";
const INTENSITIES: readonly CinematicIntensity[] = ["low", "balanced", "immersive"];

export const SERVER_STORED_PREFERENCES: StoredMotionPreferences = {
  intensity: DEFAULT_MOTION_PREFERENCES.intensity,
  performanceMode: DEFAULT_MOTION_PREFERENCES.performanceMode,
};

let stored: StoredMotionPreferences | null = null;
const preferenceListeners = new Set<() => void>();

function parseStored(raw: string | null): StoredMotionPreferences {
  try {
    const value = JSON.parse(raw ?? "null") as Partial<StoredMotionPreferences> | null;
    const intensity = INTENSITIES.find((item) => item === value?.intensity) ?? SERVER_STORED_PREFERENCES.intensity;
    return { intensity, performanceMode: value?.performanceMode === true };
  } catch {
    return SERVER_STORED_PREFERENCES;
  }
}

export function getStoredPreferencesSnapshot(): StoredMotionPreferences {
  if (stored === null) {
    try {
      stored = parseStored(localStorage.getItem(STORAGE_KEY));
    } catch {
      stored = SERVER_STORED_PREFERENCES;
    }
  }
  return stored;
}

export function subscribeStoredPreferences(onChange: () => void): () => void {
  preferenceListeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    stored = parseStored(event.newValue);
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    preferenceListeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setStoredPreferences(partial: Partial<StoredMotionPreferences>) {
  stored = { ...getStoredPreferencesSnapshot(), ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Preference still applies for this session.
  }
  for (const listener of preferenceListeners) listener();
}
