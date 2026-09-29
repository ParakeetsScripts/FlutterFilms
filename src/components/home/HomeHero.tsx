"use client";

import { CinematicScene } from "@/components/cinematic/CinematicScene";
import { PosterHall } from "@/components/cinematic/webgl/PosterHall";
import { HeroSearch, type HeroSearchStatus } from "@/components/home/HeroSearch";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { cssVars } from "@/lib/motion/css-vars";
import type { MovieSummary } from "@/lib/tmdb/types";
import { useRef, useState } from "react";

const TITLE_LETTERS = SITE_NAME.toUpperCase().split("");
const TAGLINE_PHRASES = SITE_TAGLINE.split(/(?<=\.)\s+/);
const PHRASE_DEPTHS = [-1, 0, 1];

/** Chapter 01 — the cinema wakes up. Pinned on capable desktops; normal flow everywhere else. */
export function HomeHero({ movies }: { movies: MovieSummary[] }) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<HeroSearchStatus>("idle");
  const [hasResults, setHasResults] = useState(false);

  return (
    <CinematicScene
      id="ask"
      chapter={{ index: 1, label: "Ask" }}
      sceneRef={sceneRef}
      className="home-hero"
      data-results={hasResults ? "true" : undefined}
      aria-labelledby="home-hero-question"
    >
      <div className="home-hero__stage">
        <PosterHall movies={movies} sceneRef={sceneRef} focus={status === "searching" || status === "fallback"} />

        <div className="home-hero__content">
          <div className="home-hero__titlecard" aria-hidden="true">
            {TITLE_LETTERS.map((letter, index) => (
              <span key={`${letter}-${index}`} style={cssVars({ "--i": index })}>
                {letter}
              </span>
            ))}
          </div>

          <p className="home-hero__tagline">
            {TAGLINE_PHRASES.map((phrase, index) => (
              <span key={phrase} className="home-hero__phrase" style={cssVars({ "--depth": PHRASE_DEPTHS[index] ?? 0 })}>
                <span className="home-hero__phrase-inner" style={cssVars({ "--n": index })}>
                  {phrase}
                </span>
              </span>
            ))}
          </p>

          <div className="home-hero__console-layer">
            <HeroSearch onStatusChange={setStatus} onResultsChange={setHasResults} />
          </div>
        </div>

        <div className="home-hero__cue" aria-hidden="true">
          <span>Scroll</span>
        </div>
      </div>
    </CinematicScene>
  );
}
