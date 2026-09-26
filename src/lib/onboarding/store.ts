"use client";

import { defaultOnboardingState, type OnboardingState } from "./types";

const KEY = "ff.onboarding.draft";

export const onboardingStore = {
  read(): OnboardingState {
    if (typeof window === "undefined") return defaultOnboardingState();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultOnboardingState();
      return { ...defaultOnboardingState(), ...JSON.parse(raw) };
    } catch {
      return defaultOnboardingState();
    }
  },
  write(state: OnboardingState) {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};
