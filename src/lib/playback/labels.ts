import type { PlaybackStatus } from "./types";

export function watchLabel(status: PlaybackStatus): string {
  switch (status) {
    case "PLAYABLE":
      return "Watch now";
    case "AVAILABLE_EXTERNALLY":
      return "Where to watch";
    case "TRAILER_ONLY":
      return "Watch trailer";
    default:
      return "Add to watchlist";
  }
}
