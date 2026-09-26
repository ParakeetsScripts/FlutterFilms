import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources",
  description: `Metadata sources and attribution for ${SITE_NAME}.`,
};

const SOURCES = [
  {
    name: "TMDB",
    role: "Primary metadata",
    details: "Titles, overviews, posters, backdrops, cast, crew, videos, discover lists, and watch-provider availability.",
    href: "https://www.themoviedb.org/",
  },
  {
    name: "IMDb",
    role: "Ratings & enrichment",
    details: "Official bulk datasets for ratings and vote counts on linked titles. No HTML scraping.",
    href: "https://www.imdb.com/",
  },
  {
    name: "JustWatch",
    role: "Availability",
    details: "Regional streaming, rent, and buy availability via TMDB's JustWatch partnership.",
    href: "https://www.justwatch.com/",
  },
];

export default function SourcesPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Transparency</p>
        <h1 className="page-header__title">Sources</h1>
        <p className="page-header__subtitle">
          FlutterFilms combines authorized metadata sources. Ratings from TMDB and IMDb are stored and displayed
          separately.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {SOURCES.map((source) => (
          <article key={source.name} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-6">
            <p className="eyebrow">{source.role}</p>
            <h2 className="mt-2 font-serif text-2xl">{source.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{source.details}</p>
            <a href={source.href} className="mt-5 inline-block text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">
              Visit {source.name} →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
