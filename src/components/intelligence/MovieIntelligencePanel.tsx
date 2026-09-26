"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type Briefing = {
  movieTitle: string;
  spoilerLevel: string;
  sections: Array<{ title: string; body: string; label: { kind: string } }>;
};

export function MovieIntelligencePanel({ movieId }: { movieId: number }) {
  const { settings, updateSettings } = useUserLibrary();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ai/briefing/${movieId}?spoiler=${settings.spoilerLevel}`)
      .then((r) => r.json())
      .then((data) => setBriefing(data))
      .finally(() => setLoading(false));
  }, [movieId, settings.spoilerLevel]);

  return (
    <section className="detail-section intelligence-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="section-title">AI Movie Intelligence</h2>
        <Link href={`/copilot?movie=${movieId}`} className="btn btn-secondary text-sm">Ask Copilot</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["none", "light", "moderate", "full"] as const).map((level) => (
          <button
            key={level}
            type="button"
            className={`filter-chip ${settings.spoilerLevel === level ? "is-active" : ""}`}
            onClick={() => updateSettings({ spoilerLevel: level })}
          >
            Spoiler: {level}
          </button>
        ))}
      </div>
      {loading && <p className="mt-4 text-sm text-[var(--text-muted)]">Loading briefing…</p>}
      {!loading && briefing && (
        <div className="mt-6 space-y-4">
          {briefing.sections.map((section) => (
            <article key={section.title} className="ai-usage-card">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{section.title}</h3>
                <TrustBadge kind={section.label.kind as import("@/lib/ai/trust").TrustKind} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{section.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
