"use client";

import { MovieCard } from "@/components/movie/MovieCard";
import { TrustBadge } from "@/components/ai/TrustBadge";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useState } from "react";

const STEPS = ["Plot fragment", "Actor or clue", "Era or setting", "Scene memory"];

type SceneMatch = {
  movie: MovieSummary;
  confidence: "low" | "medium" | "high";
  matchingClues: string[];
  missingInfo: string[];
};

export function RememberWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [matches, setMatches] = useState<SceneMatch[]>([]);
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [hint, setHint] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    const parts = answers.filter(Boolean);
    if (!parts.length) return;
    setLoading(true);
    const response = await fetch("/api/ai/scene-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts }),
    });
    const data = await response.json();
    setMatches(data.matches ?? []);
    setResults(data.results ?? []);
    setHint(data.hint ?? "");
    setMissing(data.missingInfo ?? []);
    setLoading(false);
  }

  return (
    <div>
      <header className="page-header">
        <p className="eyebrow">Search innovation</p>
        <h1 className="page-header__title">I Remember This Movie</h1>
        <p className="page-header__subtitle">Guided identification from vague clues — confidence reflects metadata overlap, not certainty.</p>
      </header>
      <div className="mt-8 ai-usage-card">
        <p className="eyebrow">Step {step + 1} of {STEPS.length}</p>
        <h2 className="section-title mt-2">{STEPS[step]}</h2>
        <input
          className="copilot__input mt-4 w-full"
          value={answers[step]}
          onChange={(e) => {
            const next = [...answers];
            next[step] = e.target.value;
            setAnswers(next);
          }}
          placeholder="Type what you remember…"
        />
        <div className="mt-4 flex gap-3">
          {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={search} disabled={loading}>Find it</button>
          )}
        </div>
      </div>

      {hint && <p className="mt-4 text-sm text-[var(--text-muted)]">{hint}</p>}
      {missing.length > 0 && (
        <p className="mt-2 text-sm text-amber-300/90">
          Missing info that could improve matches: {missing.join(" · ")}
        </p>
      )}

      {matches.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            <TrustBadge kind="metadata" />
            <TrustBadge kind="ai_interpretation" />
          </div>
          {matches.slice(0, 6).map((match) => (
            <div key={match.movie.id} className="ai-usage-card grid gap-4 md:grid-cols-[1fr_2fr]">
              <MovieCard movie={match.movie} />
              <div className="text-sm">
                <p className="uppercase text-xs text-[var(--muted)]">Confidence: {match.confidence}</p>
                {match.matchingClues.length ? (
                  <ul className="mt-2 list-disc pl-5 text-[var(--text-secondary)]">
                    {match.matchingClues.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                ) : (
                  <p className="mt-2 text-[var(--text-muted)]">Weak metadata overlap</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && !matches.length && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {results.map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </div>
  );
}
