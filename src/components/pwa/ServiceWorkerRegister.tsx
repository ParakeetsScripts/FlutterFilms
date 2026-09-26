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

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => {
        document.documentElement.dataset.swReady = "true";
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
