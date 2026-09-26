"use client";

import { DECADES, FEATURED_GENRES, LANGUAGES, REGIONS } from "@/lib/regions";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export function FilterDrawer() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const chips = useMemo(() => {
    const items: Array<{ label: string; key: string }> = [];
    const genre = params.get("genre");
    const language = params.get("language");
    const year = params.get("year");
    const rating = params.get("ratingGte");
    const region = params.get("region");
    if (genre) items.push({ label: FEATURED_GENRES.find((item) => String(item.id) === genre)?.name ?? `Genre ${genre}`, key: "genre" });
    if (language) items.push({ label: LANGUAGES.find((item) => item.code === language)?.name ?? language, key: "language" });
    if (year) items.push({ label: year, key: "year" });
    if (rating) items.push({ label: `TMDB ${rating}+`, key: "ratingGte" });
    if (region) items.push({ label: region, key: "region" });
    return items;
  }, [params]);

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    router.push(`/movies?${next.toString()}`);
  }

  function clearAll() {
    router.push("/movies");
    setOpen(false);
  }

  const panel = (
    <div className="filter-drawer__panel">
      <div className="filter-drawer__header">
        <h2 className="filter-drawer__title">Filters</h2>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost text-sm">
          Close
        </button>
      </div>
      <div className="filter-drawer__grid">
        <label className="filter-field">
          <span>Genre</span>
          <select defaultValue={params.get("genre") ?? ""} onChange={(event) => update("genre", event.target.value)}>
            <option value="">All genres</option>
            {FEATURED_GENRES.map((genre) => (
              <option key={genre.id} value={genre.id}>{genre.name}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Year</span>
          <input
            type="number"
            placeholder="e.g. 2007"
            defaultValue={params.get("year") ?? ""}
            onBlur={(event) => update("year", event.target.value)}
          />
        </label>
        <label className="filter-field">
          <span>Language</span>
          <select defaultValue={params.get("language") ?? ""} onChange={(event) => update("language", event.target.value)}>
            <option value="">All languages</option>
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>{language.name}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Region</span>
          <select defaultValue={params.get("region") ?? ""} onChange={(event) => update("region", event.target.value)}>
            <option value="">Any region</option>
            {REGIONS.map((region) => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Minimum TMDB rating</span>
          <select defaultValue={params.get("ratingGte") ?? ""} onChange={(event) => update("ratingGte", event.target.value)}>
            <option value="">Any rating</option>
            {[9, 8, 7, 6].map((value) => (
              <option key={value} value={value}>{value}+</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Sort by</span>
          <select defaultValue={params.get("sort") ?? "popularity"} onChange={(event) => update("sort", event.target.value)}>
            <option value="popularity">Popularity (TMDB)</option>
            <option value="rating">Rating (TMDB)</option>
            <option value="release_date">Release date</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>
      <div className="filter-drawer__decades">
        <p className="eyebrow">Decades</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DECADES.map((decade) => (
            <button
              key={decade}
              type="button"
              className="filter-chip"
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.set("yearGte", String(decade));
                next.set("yearLte", String(decade + 9));
                next.delete("page");
                router.push(`/movies?${next.toString()}`);
                setOpen(false);
              }}
            >
              {decade}s
            </button>
          ))}
        </div>
      </div>
      <div className="filter-drawer__actions">
        <button type="button" onClick={clearAll} className="btn btn-ghost">Clear all</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-primary">Apply</button>
      </div>
    </div>
  );

  return (
    <div className="filter-drawer">
      <div className="filter-drawer__toolbar">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary">
          Filters {chips.length ? `(${chips.length})` : ""}
        </button>
        <div className="hidden lg:block lg:flex-1">{panel}</div>
      </div>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => update(chip.key, "")} className="filter-chip is-active">
              {chip.label} ×
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="filter-drawer__overlay lg:hidden" onClick={() => setOpen(false)}>
          <div className="filter-drawer__sheet" onClick={(event) => event.stopPropagation()}>
            {panel}
          </div>
        </div>
      )}
    </div>
  );
}
