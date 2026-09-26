"use client";

import { migrateTheme } from "@/lib/themes";
import { useUserLibrary } from "./UserLibraryProvider";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, ready } = useUserLibrary();

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const theme = migrateTheme(settings.theme);
    root.dataset.theme = theme;
    root.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [ready, settings.reduceMotion, settings.theme]);

  return children;
}
