"use client";

import { track } from "@/lib/analytics/track";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    window.addEventListener("beforeinstallprompt", () => {
      track("install_prompt_shown");
    });
    window.addEventListener("appinstalled", () => {
      track("pwa_installed");
    });
  }, []);
  return null;
}
