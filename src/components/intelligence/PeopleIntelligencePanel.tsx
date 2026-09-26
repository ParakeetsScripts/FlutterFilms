"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import type { TrustKind } from "@/lib/ai/trust";
import { moviePath } from "@/lib/slug";
import Link from "next/link";
import { useEffect, useState } from "react";

type PersonAnalysis = {
  name: string;
  department: string;
  filmographyJourney: Array<{ id: number; title: string; year?: number | null; rating?: number | null }>;
  careerTurningPoints: string[];
  crewHighlights: Array<{ id: number; title: string; year?: number | null }>;
  decades: Array<{ decade: number; count: number }>;
  labels: Array<{ kind: string }>;
};

type SimilarResult = {
  similar: Array<{ id: number; name: string; department?: string }>;
  reason: string;
};

export function PeopleIntelligencePanel({ personId }: { personId: number }) {
  const [data, setData] = useState<PersonAnalysis | null>(null);
  const [similar, setSimilar] = useState<SimilarResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/ai/people/${personId}`).then((r) => r.json()),
      fetch(`/api/ai/people/${personId}?similar=actor`).then((r) => r.json()),
    ])
      .then(([analysis, sim]) => {
        setData(analysis);
        setSimilar(sim);
      })
      .finally(() => setLoading(false));
  }, [personId]);

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading people intelligence…</p>;
  if (!data?.name) return null;

  return (
    <section className="intelligence-panel ai-usage-card mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">People Intelligence</h2>
        <div className="flex gap-2">
          {data.labels.map((label) => (
            <TrustBadge key={label.kind} kind={label.kind as TrustKind} />
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">{data.department} · career signals from catalog credits</p>

      <div className="mt-6">
        <h3 className="font-medium">Filmography journey</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.filmographyJourney.map((m) => (
            <Link key={m.id} href={moviePath(m.id, m.title)} className="text-sm text-[var(--accent)]">
              {m.title} {m.year ? `(${m.year})` : ""}
            </Link>
          ))}
        </div>
      </div>

      {data.careerTurningPoints.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium">Career turning points</h3>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            {data.careerTurningPoints.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>
      )}

      {similar?.similar?.length ? (
        <div className="mt-6">
          <h3 className="font-medium">Actor similarity</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{similar.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {similar.similar.map((p) => (
              <Link key={p.id} href={`/person/${p.id}`} className="filter-chip">
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
