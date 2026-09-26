"use client";

import { SavedMoviesGrid } from "@/components/library/SavedMoviesGrid";
import { EmptyState } from "@/components/ui/States";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";

export default function HistoryPage() {
  const { history, ready, clearHistory } = useUserLibrary();
  if (!ready) return null;
  if (!history.length) {
    return <EmptyState title="No viewing history yet." body="Browse a movie page to start a local history." href="/movies" action="Discover movies" />;
  }
  return (
    <div>
      <div className="page-container flex justify-end pt-8">
        <button type="button" onClick={clearHistory} className="btn btn-ghost text-sm">
          Clear history
        </button>
      </div>
      <SavedMoviesGrid title="Recently Viewed" ids={history} sortKeys={["recent", "release", "title"]} />
    </div>
  );
}
