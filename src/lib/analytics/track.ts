"use client";

import { canonicalEventName } from "./events";
import { dispatchToProviders } from "./providers";
import type { AnalyticsEventName, AnalyticsProperties } from "./events";

const SESSION_KEY = "ff_analytics_session";
const SESSION_STARTED_KEY = "ff_session_started";

function getSessionId(): { id: string; isNew: boolean } {
  if (typeof window === "undefined") return { id: "server", isNew: false };
  let id = localStorage.getItem(SESSION_KEY);
  const isNew = !id;
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return { id, isNew };
}

function sendEvent(name: AnalyticsEventName, properties?: AnalyticsProperties, sessionId?: string) {
  const canonical = canonicalEventName(name);
  const sid = sessionId ?? getSessionId().id;
  dispatchToProviders(canonical, properties);
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: canonical,
      properties,
      path: window.location.pathname,
      sessionId: sid,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function track(name: AnalyticsEventName, properties?: AnalyticsProperties) {
  if (typeof window === "undefined") return;
  const { id, isNew } = getSessionId();
  if (isNew && !sessionStorage.getItem(SESSION_STARTED_KEY)) {
    sessionStorage.setItem(SESSION_STARTED_KEY, "1");
    sendEvent("session_started", undefined, id);
  }
  const canonical = canonicalEventName(name);
  const payload = {
    name: canonical,
    properties,
    path: window.location.pathname,
    sessionId: id,
  };
  dispatchToProviders(canonical, properties);
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

export { sendEvent };

export function trackPageView(path?: string) {
  track("page_viewed", { path: path ?? (typeof window !== "undefined" ? window.location.pathname : "/") });
}
