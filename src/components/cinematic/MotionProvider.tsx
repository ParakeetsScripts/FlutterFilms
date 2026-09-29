"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import {
  DEFAULT_MOTION_PREFERENCES,
  SERVER_MOTION_STATE,
  resolveMotionState,
  type CinematicIntensity,
  type DeviceCapabilities,
  type MotionPreferences,
  type MotionState,
} from "@/lib/motion/mode";
import {
  SERVER_STORED_PREFERENCES,
  getCapabilitiesServerSnapshot,
  getCapabilitiesSnapshot,
  getStoredPreferencesSnapshot,
  setStoredPreferences,
  subscribeCapabilities,
  subscribeStoredPreferences,
} from "@/lib/motion/motion-store";
import { getPointerField } from "@/lib/motion/pointer-field";
import { getScrollEngine } from "@/lib/motion/scroll-engine";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

type MotionContextValue = {
  state: MotionState;
  capabilities: DeviceCapabilities | null;
  preferences: MotionPreferences;
  setIntensity: (intensity: CinematicIntensity) => void;
  setPerformanceMode: (enabled: boolean) => void;
};

const MotionContext = createContext<MotionContextValue>({
  state: SERVER_MOTION_STATE,
  capabilities: null,
  preferences: DEFAULT_MOTION_PREFERENCES,
  setIntensity: () => {},
  setPerformanceMode: () => {},
});

export function MotionProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserLibrary();
  const capabilities = useSyncExternalStore(subscribeCapabilities, getCapabilitiesSnapshot, getCapabilitiesServerSnapshot);
  const stored = useSyncExternalStore(
    subscribeStoredPreferences,
    getStoredPreferencesSnapshot,
    () => SERVER_STORED_PREFERENCES,
  );

  const preferences = useMemo<MotionPreferences>(
    () => ({ ...stored, reduceMotion: settings.reduceMotion }),
    [stored, settings.reduceMotion],
  );

  const state = useMemo(
    () => (capabilities ? resolveMotionState(capabilities, preferences) : SERVER_MOTION_STATE),
    [capabilities, preferences],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = state.mode;
    root.dataset.scrollScenes = state.scrollScenes ? "on" : "off";
    root.dataset.pointerEffects = state.pointerEffects ? "on" : "off";
    root.dataset.webgl = state.webglScenes ? "on" : "off";
    root.dataset.grain = state.grain ? "on" : "off";
    root.style.setProperty("--depth-scale", String(state.depthScale));

    const engine = getScrollEngine();
    engine.configure({ writeVars: state.scrollScenes });
    engine.start();

    const pointer = getPointerField();
    if (state.pointerEffects) pointer.enable();
    else pointer.disable();
  }, [state]);

  useEffect(
    () => () => {
      getScrollEngine().stop();
      getPointerField().disable();
    },
    [],
  );

  const value = useMemo<MotionContextValue>(
    () => ({
      state,
      capabilities,
      preferences,
      setIntensity: (intensity) => setStoredPreferences({ intensity }),
      setPerformanceMode: (performanceMode) => setStoredPreferences({ performanceMode }),
    }),
    [state, capabilities, preferences],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  return useContext(MotionContext);
}
