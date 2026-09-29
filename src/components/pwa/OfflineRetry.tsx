"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function OfflineRetry() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    const timer = window.setTimeout(() => {
      window.location.replace("/");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [online]);

  function tryAgain() {
    window.location.replace("/");
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-3">
      {online ? (
        <p className="text-sm text-[var(--accent-soft)]">Connection restored — reopening FlutterFilms…</p>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Check your Wi‑Fi or cellular connection, then try again.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={tryAgain}>
          Try again
        </button>
        <Link href="/install" className="btn btn-secondary">Install guide</Link>
      </div>
    </div>
  );
}
