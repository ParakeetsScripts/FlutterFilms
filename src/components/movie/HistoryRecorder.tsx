"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useEffect } from "react";

export function HistoryRecorder({ movieId }: { movieId: number }) {
  const { recordHistory } = useUserLibrary();
  useEffect(() => {
    recordHistory(movieId);
    // Intentionally once per movie visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);
  return null;
}
