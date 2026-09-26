"use client";

import { SITE_FULL_NAME } from "@/lib/brand";
import { useEffect } from "react";

export function NativeBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    void import("@capacitor/app").then(({ App }) => {
      App.addListener("appUrlOpen", (event) => {
        const url = new URL(event.url);
        const path = url.pathname || url.host;
        if (path.startsWith("/") || path.includes("movie") || path.includes("room")) {
          window.location.href = path.startsWith("/") ? path : `/${path}`;
        }
      });
    }).catch(() => {});
  }, []);
  return null;
}

export async function nativeShare(title: string, url: string) {
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share({ title, url, dialogTitle: `Share from ${SITE_FULL_NAME}` });
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.impact({ style: "light" as never });
  } catch {
    if (navigator.share) await navigator.share({ title, url });
  }
}
