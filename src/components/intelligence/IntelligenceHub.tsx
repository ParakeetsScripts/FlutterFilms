"use client";

import { ChapterIndex } from "@/components/cinematic/ChapterIndex";
import { CinematicScene } from "@/components/cinematic/CinematicScene";
import type { IntelligenceFeature } from "@/lib/ai/features/registry";
import { cssVars } from "@/lib/motion/css-vars";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlatformCapabilities } from "./PlatformCapabilities";

type Stats = {
  live: number;
  degraded: number;
  beta: number;
  planned: number;
  error: number;
};

const CATEGORIES = [
  "all",
  "discovery",
  "movie",
  "people",
  "franchise",
  "personal",
  "social",
  "watching",
  "search",
  "creative",
  "agent",
] as const;

const TITLE = "CINEMA INTELLIGENCE".split("");

export function IntelligenceHub() {
  const [features, setFeatures] = useState<IntelligenceFeature[]>([]);
  const [stats, setStats] = useState<Stats>({ live: 0, degraded: 0, beta: 0, planned: 0, error: 0 });
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showPlatform, setShowPlatform] = useState(false);

  useEffect(() => {
    fetch("/api/ai/features")
      .then((r) => r.json())
      .then((data) => {
        setFeatures(data.features ?? []);
        setStats({
          live: data.live ?? 0,
          degraded: data.degraded ?? 0,
          beta: data.beta ?? 0,
          planned: data.planned ?? 0,
          error: data.error ?? 0,
        });
      });
  }, []);

  const filtered = useMemo(() => {
    return features.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (query && !`${f.title} ${f.description} ${f.slug}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [features, category, query]);

  const byCategory = useMemo(() => {
    const groups = new Map<string, IntelligenceFeature[]>();
    for (const feature of filtered) {
      const list = groups.get(feature.category) ?? [];
      list.push(feature);
      groups.set(feature.category, list);
    }
    return CATEGORIES.filter((name) => name !== "all" && groups.has(name)).map((name) => ({
      name,
      features: groups.get(name) ?? [],
    }));
  }, [filtered]);

  if (showPlatform) {
    return (
      <div className="intel-os">
        <div className="page-container" style={{ paddingBlock: 48 }}>
          <button type="button" className="btn btn-ghost text-sm" onClick={() => setShowPlatform(false)}>
            ← Back to Intelligence
          </button>
          <PlatformCapabilities stats={stats} featureCount={features.length} />
        </div>
      </div>
    );
  }

  return (
    <div className="intel-os">
      <CinematicScene id="intel-hero" chapter={{ index: 1, label: "Command" }} className="intel-hero" aria-labelledby="intel-title">
        <div className="intel-hero__count" aria-hidden="true">
          {stats.live || features.length || 200}
        </div>
        <div className="intel-hero__copy">
          <p className="chapter-marker">Cinema command center</p>
          <h1 id="intel-title" className="intel-hero__title">
            <span className="sr-only">Cinema Intelligence</span>
            <span aria-hidden="true">
              {TITLE.map((letter, index) => (
                <span key={`${letter}-${index}`} style={cssVars({ "--i": index })}>
                  {letter === " " ? "\u00a0" : letter}
                </span>
              ))}
            </span>
          </h1>
          <p className="intel-hero__subtitle">
            One system for discovering, understanding, comparing, and exploring cinema.
          </p>
          <dl className="cinema-ledger intel-hero__ledger">
            <div>
              <dt>Live</dt>
              <dd>{stats.live}</dd>
            </div>
            <div>
              <dt>Beta</dt>
              <dd>{stats.beta}</dd>
            </div>
            <div>
              <dt>Planned</dt>
              <dd>{stats.planned}</dd>
            </div>
          </dl>
          <div className="vault-hero__actions">
            <Link href="/my-cinema" className="btn btn-primary">
              My Cinema
            </Link>
            <Link href="/flutter-ai" className="btn btn-secondary" data-cursor="ai">
              FlutterAI
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPlatform(true)}>
              Platform
            </button>
          </div>
        </div>
      </CinematicScene>

      <CinematicScene id="intel-map" chapter={{ index: 2, label: "Capabilities" }} className="chapter chapter--intel" aria-labelledby="intel-map-title">
        <div className="chapter__inner">
          <header className="chapter-head">
            <p className="chapter-marker">02 — Instruments</p>
            <h2 id="intel-map-title" className="chapter-head__title">
              {features.length || 200} live capabilities
            </h2>
            <p className="chapter-head__reason">
              Counts are computed from the capability registry. Each card opens a working execution surface.
            </p>
          </header>

          <div className="intel-console">
            <label className="sr-only" htmlFor="intel-search">
              Search 200 capabilities
            </label>
            <input
              id="intel-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search intelligence…"
              className="intel-console__search"
            />
            <div className="intelligence-filter-chips" role="tablist" aria-label="Feature categories">
              {CATEGORIES.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={category === name}
                  className={`filter-chip ${category === name ? "is-active" : ""}`}
                  onClick={() => setCategory(name)}
                >
                  {name === "all" ? "All" : name}
                </button>
              ))}
            </div>
          </div>

          {byCategory.map((group, groupIndex) => (
            <section key={group.name} className="intel-domain" aria-labelledby={`intel-domain-${group.name}`}>
              <header className="intel-domain__head">
                <p className="micro-label">
                  {String(groupIndex + 1).padStart(2, "0")} — {group.name}
                </p>
                <h3 id={`intel-domain-${group.name}`} className="intel-domain__title">
                  {group.name}
                </h3>
                <p className="intel-domain__count">{group.features.length} live</p>
              </header>
              <div className="intel-constellation">
                {group.features.map((feature, index) => (
                  <article
                    key={feature.id}
                    className={`intel-card intel-card--${feature.status}`}
                    style={cssVars({ "--i": index % 8 })}
                  >
                    <div className="intel-card__meta">
                      <span>#{feature.id}</span>
                      <span>{feature.status}</span>
                    </div>
                    <h4 className="intel-card__title">{feature.title}</h4>
                    <p className="intel-card__body">{feature.description}</p>
                    <Link href={feature.route} className="btn btn-ghost text-sm">
                      Run
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </CinematicScene>

      <ChapterIndex label="Intelligence chapters" />
    </div>
  );
}
