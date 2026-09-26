"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useEffect } from "react";

export function MovieViewTracker({ movieId }: { movieId: number }) {
  const { recordHistory } = useUserLibrary();
  useEffect(() => {
    recordHistory(movieId);
  }, [movieId, recordHistory]);
  return null;
}
