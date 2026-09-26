"use client";

import { useEffect, useRef, useState } from "react";

const sessionCache = new Map<string, unknown>();

export function useDebouncedSearch<T>(
  query: string,
  fetcher: (q: string) => Promise<T>,
  minLength = 2,
  delayMs = 280,
) {
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < minLength) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (sessionCache.has(cacheKey)) {
      setResults(sessionCache.get(cacheKey) as T);
      setLoading(false);
      setError(null);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      void fetcher(trimmed)
        .then((data) => {
          if (id !== requestId.current) return;
          sessionCache.set(cacheKey, data);
          setResults(data);
          setLoading(false);
        })
        .catch(() => {
          if (id !== requestId.current) return;
          setError("Couldn't load results. Retry in a moment.");
          setLoading(false);
        });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [query, fetcher, minLength, delayMs]);

  return { results, loading, error };
}
