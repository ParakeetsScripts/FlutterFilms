"use client";

import { SavedMoviesGrid } from "@/components/library/SavedMoviesGrid";
import { EmptyState } from "@/components/ui/States";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";

export default function FavoritesPage() {
  const { favorites, ready } = useUserLibrary();
  if (!ready) return null;
  if (!favorites.length) {
    return <EmptyState title="Save movies you love." body="Favorites stay separate from your watchlist." href="/movies" action="Explore movies" />;
  }
  return <SavedMoviesGrid title="Favorites" ids={favorites} sortKeys={["recent", "title", "rating"]} />;
}
