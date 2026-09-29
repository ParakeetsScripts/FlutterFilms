"use client";

import { TrustBadge } from "@/components/ai/TrustBadge";
import { ChapterIndex } from "@/components/cinematic/ChapterIndex";
import { CinematicScene, usePointerTarget } from "@/components/cinematic/CinematicScene";
import { useMotion } from "@/components/cinematic/MotionProvider";
import { WeeklyBriefCard } from "@/components/intelligence/WeeklyBriefCard";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import { track } from "@/lib/analytics/track";
import type { TasteDna } from "@/lib/ai/intelligence/taste";
import { SITE_NAME } from "@/lib/brand";
import { cssVars } from "@/lib/motion/css-vars";
import { moviePath } from "@/lib/slug";
import { genreIdForName } from "@/lib/tmdb/genres";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { Movie } from "@/lib/tmdb/types";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const VAULT_LIMIT = 18;
const TITLE = "MY CINEMA".split("");

type TasteResponse = {
  dna: TasteDna | null;
  explanations: string[];
  contradictions: string[];
  personality: { archetype: string; headline: string; topGenre: string; topDecade: number; unexplored: string[] } | null;
};

type TasteState = { key: string; status: "loading" | "ready" | "error"; data: TasteResponse | null };

function useLibraryMovies(ids: number[]) {
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; movies: Movie[] }>({ key: "", movies: [] });
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void Promise.all(
      key.split(",").map(async (id) => {
        const response = await fetch(`/api/movies/${id}`);
        return response.ok ? ((await response.json()) as Movie) : null;
      }),
    ).then((movies) => {
      if (!cancelled) setState({ key, movies: movies.filter((movie): movie is Movie => Boolean(movie?.id)) });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return state.key === key ? state.movies : [];
}

function useTaste(movieIds: number[], favorites: number[]): TasteState | null {
  const key = `${movieIds.join(",")}|${favorites.join(",")}`;
  const [state, setState] = useState<TasteState | null>(null);
  useEffect(() => {
    const [idPart, favoritePart] = key.split("|");
    const ids = idPart ? idPart.split(",").map(Number) : [];
    if (!ids.length) return;
    let cancelled = false;
    fetch("/api/ai/taste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieIds: ids, favorites: favoritePart ? favoritePart.split(",").map(Number) : [] }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((data: TasteResponse) => {
        if (cancelled) return;
        setState({ key, status: "ready", data });
        track("taste_dna_viewed");
      })
      .catch(() => {
        if (!cancelled) setState({ key, status: "error", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);
  if (!movieIds.length) return null;
  return state?.key === key ? state : { key, status: "loading", data: null };
}

/** My Cinema as a personal vault: the viewer's own posters, then their taste as a 3D constellation. */
export function MyCinemaView() {
  const { watchlist, favorites, history, settings, updateSettings, clearPersonalization } = useUserLibrary();
  const { state } = useMotion();
  const libraryIds = useMemo(() => [...new Set([...favorites, ...watchlist, ...history])], [favorites, watchlist, history]);
  const vaultMovies = useLibraryMovies(libraryIds.slice(0, VAULT_LIMIT));
  const taste = useTaste(libraryIds, favorites);
  const dna = taste?.data?.dna ?? null;
  const vaultRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  usePointerTarget(vaultRef, state.pointerEffects);
  usePointerTarget(constellationRef, state.pointerEffects);
  const empty = libraryIds.length === 0;

  return (
    <div className="my-cinema my-cinema--spatial">
      <CinematicScene id="vault" chapter={{ index: 1, label: "Vault" }} className="vault-hero" aria-labelledby="my-cinema-title">
        <div ref={vaultRef} className="vault-hero__stage">
          <div className="vault-ring" aria-hidden="true">
            <div className="vault-ring__rotor" style={cssVars({ "--count": Math.max(vaultMovies.length, 1) })}>
              {vaultMovies.map((movie, index) => {
                const src = getPosterUrl(movie.posterPath, "w342");
                return src ? (
                  <span key={movie.id} className="vault-ring__print" style={cssVars({ "--i": index })}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" decoding="async" />
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <div className="vault-hero__copy">
            <p className="chapter-marker">Personal intelligence</p>
            <h1 id="my-cinema-title" className="vault-hero__title">
              <span className="sr-only">My Cinema</span>
              <span aria-hidden="true">
                {TITLE.map((letter, index) => (
                  <span key={`${letter}-${index}`} style={cssVars({ "--i": index })}>
                    {letter === " " ? "\u00a0" : letter}
                  </span>
                ))}
              </span>
            </h1>
            <p className="vault-hero__subtitle">
              Taste DNA, weekly briefs, and your cinematic identity — built only from what you&apos;ve saved, favorited, and watched.
            </p>
            <dl className="cinema-ledger vault-hero__ledger">
              <div>
                <dt>Watchlist</dt>
                <dd>{watchlist.length}</dd>
              </div>
              <div>
                <dt>Favorites</dt>
                <dd>{favorites.length}</dd>
              </div>
              <div>
                <dt>Watched</dt>
                <dd>{history.length}</dd>
              </div>
            </dl>
            <div className="vault-hero__actions">
              <Link href="/my-cinema/interview" className="btn btn-secondary">
                AI Movie Interview
              </Link>
              <Link href="/intelligence/discover" className="btn btn-secondary">
                Discovery Lab
              </Link>
              <Link href="/flutter-ai" className="btn btn-primary" data-cursor="ai">
                FlutterAI
              </Link>
              <Link href="/intelligence" className="btn btn-ghost">
                All 200 features
              </Link>
            </div>
          </div>
        </div>
      </CinematicScene>

      {empty ? (
        <section className="vault-empty page-container" aria-labelledby="vault-empty-title">
          <p className="micro-label">Nothing screened yet</p>
          <h2 id="vault-empty-title" className="vault-empty__title">
            Your cinema is waiting.
          </h2>
          <p className="vault-empty__body">Save, favorite, or watch a few films and {SITE_NAME} will map your taste here.</p>
          <div className="vault-hero__actions">
            <Link href="/movies" className="btn btn-primary">
              Discover movies
            </Link>
            <Link href="/onboarding" className="btn btn-secondary">
              Start onboarding
            </Link>
          </div>
        </section>
      ) : (
        <CinematicScene id="dna" chapter={{ index: 2, label: "Taste DNA" }} className="chapter chapter--dna" aria-labelledby="dna-title">
          <div className="chapter__inner">
            <header className="chapter-head">
              <p className="chapter-marker">02 — Taste DNA 2.0</p>
              <div className="chapter-head__row">
                <div className="chapter-head__copy">
                  <h2 id="dna-title" className="chapter-head__title">
                    Your taste, in space
                  </h2>
                  <p className="chapter-head__reason">
                    {dna ? `Calculated from ${dna.movieCount} titles in your library.` : "Mapping your library…"} Node size is each genre&apos;s share of that library.
                  </p>
                </div>
                {dna ? (
                  <div className="dna-badges">
                    {dna.labels.map((label) => (
                      <TrustBadge key={label.kind} kind={label.kind} />
                    ))}
                  </div>
                ) : null}
              </div>
            </header>

            {taste?.status === "error" ? (
              <p className="dna-note" role="alert">
                The projection missed a frame — Taste DNA couldn&apos;t be calculated right now.
              </p>
            ) : !dna ? (
              <div className="dna-loading" role="status">
                <span className="dna-loading__beam" aria-hidden="true" />
                Reading your library…
              </div>
            ) : (
              <>
                <div className="dna-stage">
                  <div ref={constellationRef} className="dna-constellation" aria-hidden="true">
                    <div className="dna-constellation__orbit">
                      <span className="dna-constellation__ring dna-constellation__ring--inner" />
                      <span className="dna-constellation__ring dna-constellation__ring--outer" />
                      <span className="dna-constellation__core">
                        <strong>{dna.movieCount}</strong>
                        <span>titles</span>
                      </span>
                      {dna.genres.slice(0, 8).map((genre, index, list) => (
                        <span
                          key={genre.name}
                          className="dna-node"
                          style={cssVars({
                            "--angle": `${(index / list.length) * 360}deg`,
                            "--lift": `${index % 2 === 0 ? -1 : 1}`,
                            "--size": `${Math.round(46 + genre.percent * 1.3)}px`,
                            "--i": index,
                          })}
                        >
                          <span className="dna-node__face">
                            <span className="dna-node__value">{genre.percent}%</span>
                            <span className="dna-node__name">{genre.name}</span>
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="dna-readout">
                    {taste?.data?.personality ? (
                      <article className="dna-card">
                        <p className="micro-label">Movie personality card · derived from your library</p>
                        <h3 className="dna-card__title">{taste.data.personality.archetype}</h3>
                        <p className="dna-card__body">{taste.data.personality.headline}</p>
                        <p className="dna-card__meta">Peak decade: {taste.data.personality.topDecade}s</p>
                      </article>
                    ) : null}
                    <h3 className="micro-label dna-readout__label">Genre shares</h3>
                    <ul className="dna-shares">
                      {dna.genres.slice(0, 8).map((genre) => {
                        const id = genreIdForName(genre.name);
                        return (
                          <li key={genre.name}>
                            {id ? <Link href={`/movies?genre=${id}`}>{genre.name}</Link> : <span>{genre.name}</span>}
                            <span className="dna-shares__bar" aria-hidden="true">
                              <span style={cssVars({ "--share": `${genre.percent}%` })} />
                            </span>
                            <span className="dna-shares__value">
                              {genre.percent}% · {genre.count}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="dna-strata">
                  <section className="dna-panel" aria-labelledby="dna-decades">
                    <h3 id="dna-decades" className="micro-label">
                      Decade map
                    </h3>
                    <ol className="dna-decades">
                      {[...dna.decades]
                        .sort((a, b) => a.decade - b.decade)
                        .map((entry) => {
                          const max = Math.max(...dna.decades.map((d) => d.count), 1);
                          return (
                            <li key={entry.decade} style={cssVars({ "--height": `${Math.round((entry.count / max) * 100)}%` })}>
                              <span className="dna-decades__bar" aria-hidden="true" />
                              <span className="dna-decades__label">{entry.decade}s</span>
                              <span className="dna-decades__count">{entry.count}</span>
                            </li>
                          );
                        })}
                    </ol>
                  </section>
                  <section className="dna-panel" aria-labelledby="dna-world">
                    <h3 id="dna-world" className="micro-label">
                      Global cinema
                    </h3>
                    <ul className="dna-chips">
                      {dna.countries.slice(0, 8).map((country) => (
                        <li key={country.name}>
                          {country.name} <span>{country.count}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="dna-panel" aria-labelledby="dna-averages">
                    <h3 id="dna-averages" className="micro-label">
                      Averages · calculated from your library
                    </h3>
                    <dl className="dna-averages">
                      <div>
                        <dt>Runtime</dt>
                        <dd>{dna.avgRuntime ? `${dna.avgRuntime}m` : "—"}</dd>
                      </div>
                      <div>
                        <dt>TMDB</dt>
                        <dd>{dna.avgTmdb ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>IMDb</dt>
                        <dd>{dna.avgImdb ?? "pending"}</dd>
                      </div>
                    </dl>
                  </section>
                  {dna.unexploredGenres.length ? (
                    <section className="dna-panel" aria-labelledby="dna-unexplored">
                      <h3 id="dna-unexplored" className="micro-label">
                        Unexplored in your library
                      </h3>
                      <ul className="dna-chips">
                        {dna.unexploredGenres.map((name) => {
                          const id = genreIdForName(name);
                          return <li key={name}>{id ? <Link href={`/movies?genre=${id}`}>{name} →</Link> : name}</li>;
                        })}
                      </ul>
                    </section>
                  ) : null}
                </div>

                {taste?.data?.explanations.length ? (
                  <section className="dna-panel dna-panel--wide" aria-labelledby="dna-why">
                    <h3 id="dna-why" className="micro-label">
                      Why {SITE_NAME} thinks this
                    </h3>
                    <ul className="dna-lines">
                      {taste.data.explanations.map((line) => (
                        <li key={line}>
                          {line} <TrustBadge kind="user" />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {taste?.data?.contradictions.length ? (
                  <section className="dna-panel dna-panel--wide" aria-labelledby="dna-contradictions">
                    <h3 id="dna-contradictions" className="micro-label">
                      Taste contradictions
                    </h3>
                    <ul className="dna-lines">
                      {taste.data.contradictions.map((line) => (
                        <li key={line}>
                          {line} <TrustBadge kind="ai_prediction" />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <div className="dna-controls">
                  <label className="dna-controls__toggle">
                    <input
                      type="checkbox"
                      checked={settings.disablePersonalizedRows}
                      onChange={(event) => {
                        updateSettings({ disablePersonalizedRows: event.target.checked });
                        track("taste_dna_updated", { action: "pause_learning" });
                      }}
                    />
                    Pause learning
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost text-sm"
                    onClick={() => {
                      clearPersonalization();
                      track("taste_dna_updated", { action: "reset" });
                    }}
                  >
                    Reset Taste DNA
                  </button>
                  <Link href="/account/privacy" className="btn btn-ghost text-sm">
                    Privacy controls
                  </Link>
                </div>
              </>
            )}
          </div>
        </CinematicScene>
      )}

      {vaultMovies.length ? (
        <CinematicScene id="shelf" chapter={{ index: 3, label: "Shelf" }} className="chapter chapter--shelf" aria-labelledby="shelf-title">
          <div className="chapter__inner">
            <header className="chapter-head">
              <p className="chapter-marker">03 — Your shelf</p>
              <h2 id="shelf-title" className="chapter-head__title">
                In your cinema
              </h2>
            </header>
            <ol className="vault-shelf">
              {vaultMovies.map((movie, index) => {
                const src = getPosterUrl(movie.posterPath, "w185");
                return (
                  <li key={movie.id} style={cssVars({ "--i": index })}>
                    <Link href={moviePath(movie.id, movie.title)} className="vault-shelf__tile" aria-label={`Open ${movie.title}`}>
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span>{movie.title}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </CinematicScene>
      ) : null}

      <CinematicScene id="tools" chapter={{ index: 4, label: "Tools" }} className="chapter chapter--tools" aria-labelledby="tools-title">
        <div className="chapter__inner">
          <header className="chapter-head">
            <p className="chapter-marker">04 — Instruments</p>
            <h2 id="tools-title" className="chapter-head__title">
              Your controls
            </h2>
          </header>
          <div className="vault-tools">
            <article className="vault-tool">
              <p className="micro-label">Privacy</p>
              <h3>Private Mode</h3>
              <p>{settings.privateMode ? "On — self-hosted routing" : "Off"}</p>
              <Link href="/settings" className="btn btn-ghost">
                Settings
              </Link>
            </article>
            <article className="vault-tool">
              <p className="micro-label">Franchises</p>
              <h3>Franchise tracker</h3>
              <p>Track completion from collection pages.</p>
              <Link href="/franchises" className="btn btn-ghost">
                Franchises
              </Link>
            </article>
            <article className="vault-tool">
              <p className="micro-label">Playback</p>
              <h3>Smart Resume</h3>
              <p>Continue authorized playback from home.</p>
              <Link href="/" className="btn btn-ghost">
                Home
              </Link>
            </article>
          </div>
          <WeeklyBriefCard />
        </div>
      </CinematicScene>

      <ChapterIndex label="My Cinema chapters" />
    </div>
  );
}
