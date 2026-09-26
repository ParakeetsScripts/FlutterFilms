export type FreshnessClass = "FRESH" | "RECENT" | "STALE" | "VERY_STALE";

export function classifyFreshness(iso: string | null | undefined, source: "tmdb" | "imdb"): FreshnessClass {
  if (!iso) return "VERY_STALE";
  const ageHours = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
  if (source === "imdb") {
    if (ageHours < 24) return "FRESH";
    if (ageHours < 48) return "RECENT";
    if (ageHours < 72) return "STALE";
    return "VERY_STALE";
  }
  if (ageHours < 6) return "FRESH";
  if (ageHours < 24) return "RECENT";
  if (ageHours < 72) return "STALE";
  return "VERY_STALE";
}

export function formatRelativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
