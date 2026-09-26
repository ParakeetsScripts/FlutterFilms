"use client";

import type { AnalyticsEventName, AnalyticsProperties } from "./events";

export type AnalyticsProvider = {
  name: string;
  track: (name: AnalyticsEventName, properties?: AnalyticsProperties) => void;
};

const providers: AnalyticsProvider[] = [];

export function registerAnalyticsProvider(provider: AnalyticsProvider) {
  providers.push(provider);
}

export function dispatchToProviders(name: AnalyticsEventName, properties?: AnalyticsProperties) {
  for (const provider of providers) {
    try {
      provider.track(name, properties);
    } catch {
      // optional providers must not break first-party tracking
    }
  }
}

export function initVercelAnalytics() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_VERCEL_ANALYTICS) return;
  registerAnalyticsProvider({
    name: "vercel",
    track(name, properties) {
      const va = (window as Window & { va?: { track?: (n: string, p?: Record<string, unknown>) => void } }).va;
      va?.track?.(name, properties as Record<string, unknown>);
    },
  });
}
