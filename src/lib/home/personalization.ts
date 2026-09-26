export type TasteSignals = {
  favorites: number[];
  continueWatching: Array<{ movieId: number; positionSeconds: number }>;
  disablePersonalizedRows?: boolean;
};

/** Anchor for "Because you watched" — requires favorite or meaningful playback. */
export function getTasteAnchorId(signals: TasteSignals): number | null {
  if (signals.disablePersonalizedRows) return null;

  const startedWatching = signals.continueWatching.find((item) => item.positionSeconds >= 60);
  const hasTasteSignal = signals.favorites.length > 0 || Boolean(startedWatching);
  if (!hasTasteSignal) return null;

  if (signals.favorites[0]) return signals.favorites[0];
  if (startedWatching) return startedWatching.movieId;
  return null;
}
