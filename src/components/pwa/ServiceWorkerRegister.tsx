"use client";

import { track } from "@/lib/analytics/track";
import { captureInstallPrompt } from "@/lib/pwa/install-prompt";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onInstallPrompt = (event: Event) => {
      captureInstallPrompt(event);
      window.dispatchEvent(new Event("ff-install-prompt-ready"));
      track("install_prompt_shown");
    };

    const onInstalled = () => {
      track("pwa_installed");
      window.dispatchEvent(new Event("ff-pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (process.env.NODE_ENV !== "production") {
      // Dev chunk URLs are reused across edits, so a caching worker would serve stale code.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      });
      void caches
        ?.keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith("flutter-films-")).map((key) => caches.delete(key))));
    } else {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => {
          document.documentElement.dataset.swReady = "true";
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
