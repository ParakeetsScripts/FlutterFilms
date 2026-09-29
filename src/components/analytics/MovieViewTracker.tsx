"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useEffect } from "react";

export function MovieViewTracker({ movieId }: { movieId: number }) {
  const { recordHistory } = useUserLibrary();
  useEffect(() => {
    recordHistory(movieId);
    // Intentionally once per movie visit — recordHistory is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);
  return null;
}
