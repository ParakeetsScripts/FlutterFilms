"use client";

import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImportDeviceData() {
  const { watchlist, favorites, history, continueWatching, settings } = useUserLibrary();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState({
    watchlist: true,
    favorites: true,
    history: true,
    continue: true,
    settings: true,
  });

  async function importData(mode: "all" | "selective" | "skip") {
    setLoading(true);
    await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlist,
        favorites,
        history: history.map((movieId) => ({ movieId, viewedAt: new Date().toISOString() })),
        continueWatching,
        settings,
        mergeMode: mode,
        mergeSelection: selection,
      }),
    });
    setLoading(false);
    router.push("/account");
  }

  const hasLocal = watchlist.length || favorites.length || history.length;

  return (
    <section className="ai-usage-card">
      <h2 className="section-title">Import your FlutterFilms history?</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {hasLocal
          ? "We found data on this device. Import to your account without overwriting newer cloud data."
          : "No local library data found on this device."}
      </p>
      {hasLocal && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(selection).map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={`filter-chip ${value ? "is-active" : ""}`}
              onClick={() => setSelection((s) => ({ ...s, [key]: !s[key as keyof typeof s] }))}
            >
              {key}
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" disabled={loading || !hasLocal} onClick={() => importData("all")}>
          Import all
        </button>
        <button type="button" className="btn btn-secondary" disabled={loading || !hasLocal} onClick={() => importData("selective")}>
          Import selected
        </button>
        <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => importData("skip")}>
          Skip
        </button>
      </div>
    </section>
  );
}
