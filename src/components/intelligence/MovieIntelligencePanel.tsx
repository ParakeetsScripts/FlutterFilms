"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { TrustKind } from "@/lib/ai/trust";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BriefingSection = {
  title: string;
  body: string;
  label: { kind: string };
};

type Briefing = {
  movieTitle: string;
  spoilerLevel: string;
  sections: BriefingSection[];
};

const GROUPS: Array<{ id: string; title: string; match: (title: string) => boolean }> = [
  {
    id: "facts",
    title: "Catalog facts",
    match: (t) => ["At a glance", "Ratings (separate sources)"].includes(t),
  },
  {
    id: "understand",
    title: "Understand",
    match: (t) =>
      [
        "Should I watch this?",
        "Synopsis",
        "Character primer",
        "Franchise context",
        "Spoiler-safe briefing",
        "First-time viewer guide",
      ].includes(t),
  },
  {
    id: "analyze",
    title: "Analyze",
    match: (t) =>
      ["Genres", "Motif signals", "Filmmaking breakdown", "Movie DNA"].includes(t),
  },
  {
    id: "spoilers",
    title: "Spoilers",
    match: (t) => t === "Spoiler zone",
  },
];

const QUICK_PROMPTS = [
  { label: "Explain without spoilers", q: "Explain this movie without spoilers.", level: "none" as const },
  { label: "Themes", q: "What themes stand out in this film?", level: "none" as const },
  { label: "Characters", q: "Who are the key characters?", level: "none" as const },
  { label: "Ending", q: "Explain the ending.", level: "full" as const },
];

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

  const grouped = useMemo(() => {
    if (!briefing) return [];
    return GROUPS.map((group) => ({
      ...group,
      sections: briefing.sections.filter((section) => group.match(section.title)),
    })).filter((group) => group.sections.length > 0);
  }, [briefing]);

  return (
    <section className="detail-section intelligence-panel" data-testid="movie-intelligence">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">FlutterAI</p>
          <h2 className="section-title">Movie intelligence</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Source-grounded facts, calculated signals, and spoiler-aware analysis.
          </p>
        </div>
        <Link
          href={`/flutter-ai?movie=${movieId}`}
          className="btn btn-primary text-sm"
          data-testid="ask-flutterai"
        >
          Ask FlutterAI
        </Link>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Spoiler protection</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["none", "light", "moderate", "full"] as const).map((level) => (
            <button
              key={level}
              type="button"
              className={`filter-chip ${settings.spoilerLevel === level ? "is-active" : ""}`}
              onClick={() => updateSettings({ spoilerLevel: level })}
              data-testid={`spoiler-${level}`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Evidence sent to FlutterAI is filtered to match this level — not just a prompt hint.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <Link
            key={prompt.label}
            href={`/flutter-ai?movie=${movieId}&q=${encodeURIComponent(prompt.q)}&spoiler=${prompt.level}`}
            className="filter-chip"
          >
            {prompt.label}
          </Link>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-[var(--text-muted)]">Loading briefing…</p>}

      {!loading && briefing && (
        <div className="mt-8 space-y-8">
          {grouped.map((group) => (
            <div key={group.id}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {group.title}
              </h3>
              <div className="mt-4 space-y-3">
                {group.sections.map((section) => (
                  <article key={section.title} className="ai-usage-card">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium">{section.title}</h4>
                      <TrustBadge kind={section.label.kind as TrustKind} />
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-[var(--text-secondary)]">
                      {section.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
