"use client";

import { MovieRow } from "@/components/movie/MovieRow";
import { TrustBadge } from "@/components/ai/TrustBadge";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useEffect, useState } from "react";

export function WeeklyBriefCard() {
  const [sections, setSections] = useState<Array<{ title: string; movies: MovieSummary[] }>>([]);

  useEffect(() => {
    fetch("/api/ai/weekly-brief")
      .then((r) => r.json())
      .then((data) => setSections(data.sections ?? []));
  }, []);

  if (!sections.length) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="section-title">Weekly Discovery Brief</h2>
        <TrustBadge kind="metadata" />
      </div>
      {sections.map((section) => (
        <MovieRow key={section.title} title={section.title} movies={section.movies} />
      ))}
    </section>
  );
}
