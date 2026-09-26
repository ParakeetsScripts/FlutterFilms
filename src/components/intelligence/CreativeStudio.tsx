"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import type { TrustKind } from "@/lib/ai/trust";
import { useEffect, useState } from "react";

const KINDS = [
  { id: "poster", label: "Concept poster" },
  { id: "watchlist_poster", label: "Watchlist poster" },
  { id: "movie_night_card", label: "Movie night card" },
  { id: "franchise_timeline", label: "Franchise timeline" },
  { id: "comparison", label: "Comparison graphic" },
  { id: "trailer_concept", label: "Trailer concept" },
  { id: "review_outline", label: "Review assistant" },
] as const;

type JobRow = {
  id: string;
  status: string;
  created_at: string;
  prompt?: string | null;
};

export function CreativeStudio() {
  const { watchlist } = useUserLibrary();
  const [kind, setKind] = useState<string>("poster");
  const [title, setTitle] = useState("My Cinema Night");
  const [subtitle, setSubtitle] = useState("");
  const [svg, setSvg] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);

  useEffect(() => {
    fetch("/api/generation/image")
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => {});
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generation/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          prompt: subtitle || undefined,
          watchlistIds: watchlist,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setSvg(data.asset?.svg ?? data.svg ?? null);
      setTextContent(data.asset?.textContent ?? data.textContent ?? "");
      if (data.jobs) setJobs(data.jobs);
      else {
        const refresh = await fetch("/api/generation/image").then((r) => r.json());
        setJobs(refresh.jobs ?? []);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="creative-studio space-y-8">
      <section className="ai-usage-card">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="section-title">AI Creative Studio</h2>
          <TrustBadge kind={"ai_interpretation" as TrustKind} />
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Concept cards use SVG templates. Trailer and review outlines use your connected AI model when available.
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
            placeholder={kind === "comparison" ? "Compare with…" : "Subtitle or context"}
          />
        </div>

        {(kind === "watchlist_poster" || kind === "movie_night_card") && (
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Uses {watchlist.length} film{watchlist.length === 1 ? "" : "s"} from your watchlist.
          </p>
        )}

        <button type="button" className="btn btn-primary mt-4" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "Generate"}
        </button>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </section>

      {svg && (
        <section className="ai-usage-card">
          <div className="overflow-hidden rounded-xl border border-[var(--line)]" dangerouslySetInnerHTML={{ __html: svg }} />
        </section>
      )}

      {textContent && (
        <section className="ai-usage-card">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]">AI text output</p>
          <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{textContent}</pre>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="ai-usage-card">
          <h3 className="font-medium">Recent generations</h3>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            {jobs.slice(0, 8).map((job) => (
              <li key={job.id}>
                {job.status} · {job.prompt?.slice(0, 60) ?? "Creative job"} · {new Date(job.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
