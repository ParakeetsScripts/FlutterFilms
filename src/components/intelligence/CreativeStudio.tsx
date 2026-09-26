"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { TrustKind } from "@/lib/ai/trust";
import { useState } from "react";

const KINDS = [
  { id: "poster", label: "Concept poster" },
  { id: "watchlist_poster", label: "Watchlist poster" },
  { id: "movie_night_card", label: "Movie night card" },
  { id: "franchise_timeline", label: "Franchise timeline" },
  { id: "comparison", label: "Comparison graphic" },
  { id: "trailer_concept", label: "Trailer concept" },
  { id: "review_outline", label: "Review assistant" },
] as const;

export function CreativeStudio() {
  const { watchlist } = useUserLibrary();
  const [kind, setKind] = useState<string>("poster");
  const [title, setTitle] = useState("My Cinema Night");
  const [subtitle, setSubtitle] = useState("");
  const [svg, setSvg] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const response = await fetch("/api/generation/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: kind === "poster" ? "poster" : kind === "watchlist_poster" ? "watchlist_poster" : kind === "movie_night_card" ? "movie_night_card" : "poster",
        title,
        prompt: subtitle || `${watchlist.length} films on your watchlist`,
      }),
    });
    const data = await response.json();
    setSvg(data.asset?.svg ?? data.svg ?? null);
    setTextContent(data.asset?.textContent ?? data.textContent ?? "");
    setLoading(false);
  }

  return (
    <div className="creative-studio space-y-8">
      <section className="ai-usage-card">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="section-title">AI Creative Studio</h2>
          <TrustBadge kind={"ai_interpretation" as TrustKind} />
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          All outputs are labeled AI-generated fan concepts — never official studio artwork.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-chip ${kind === item.id ? "is-active" : ""}`}
              onClick={() => setKind(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            placeholder="Title"
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            placeholder="Subtitle"
          />
        </div>

        <button type="button" className="btn btn-primary mt-4" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "Generate"}
        </button>
      </section>

      {svg && (
        <section className="ai-usage-card">
          <div className="overflow-hidden rounded-xl border border-[var(--line)]" dangerouslySetInnerHTML={{ __html: svg }} />
        </section>
      )}

      {textContent && (
        <section className="ai-usage-card">
          <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{textContent}</pre>
        </section>
      )}
    </div>
  );
}
