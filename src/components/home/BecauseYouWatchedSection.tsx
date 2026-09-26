"use client";

import { PersonalizedRow } from "@/components/home/PersonalizedRow";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { getTasteAnchorId } from "@/lib/home/personalization";
import Link from "next/link";
import { useMemo } from "react";

/**
 * Shown only when the user has meaningful taste signals:
 * favorited a title (good) or started playback (watched).
 */
export function BecauseYouWatchedSection() {
  const { favorites, continueWatching, settings, ready } = useUserLibrary();

  const anchorId = useMemo(() => {
    if (!ready) return null;
    return getTasteAnchorId({
      favorites,
      continueWatching,
      disablePersonalizedRows: settings.disablePersonalizedRows,
    });
  }, [continueWatching, favorites, ready, settings.disablePersonalizedRows]);

  if (!anchorId) return null;

  return (
    <section className="home-section">
      <div className="home-section__header">
        <div>
          <h2 className="section-title">Because you watched</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Continue your taste thread with real catalog neighbors.
          </p>
        </div>
        <Link href={`/movie/${anchorId}`} className="btn btn-ghost text-sm">
          View anchor
        </Link>
      </div>
      <PersonalizedRow anchorId={anchorId} title="" />
    </section>
  );
}
