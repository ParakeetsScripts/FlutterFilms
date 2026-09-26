"use client";

import { SavedMoviesGrid } from "@/components/library/SavedMoviesGrid";
import { EmptyState } from "@/components/ui/States";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";

export default function WatchlistPage() {
  const { watchlist, ready } = useUserLibrary();
  if (!ready) {
    return (
      <div className="page-container page-section">
        <p className="text-sm text-[var(--text-muted)]" role="status">Loading your watchlist…</p>
      </div>
    );
  }
  if (!watchlist.length) {
    return <EmptyState title="Your watchlist is empty." body="Save films you want to see later." href="/movies" action="Explore movies" />;
  }
  return <SavedMoviesGrid title="My Watchlist" ids={watchlist} defaultSort="recent" />;
}
