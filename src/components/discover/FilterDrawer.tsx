"use client";

import {
  activeDecadeFromDraft,
  buildMoviesHrefFromDraft,
  emptyFilterDraft,
  filterDraftFromParams,
  type FilterDraft,
} from "@/lib/discover/filter-draft";
import { countActiveFilters, SORT_LABELS } from "@/lib/discover/filters";
import {
  COUNTRY_CONTINENTS,
  DECADES,
  LANGUAGES,
  MOVIE_GENRES,
  countriesByContinent,
  findCountry,
  searchCountries,
} from "@/lib/regions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FilterTab = "filters" | "regions";

export function FilterDrawer({ onNavigate }: { onNavigate?: () => void } = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<FilterTab>("filters");
  const [draft, setDraft] = useState<FilterDraft>(emptyFilterDraft);
  const [countryQuery, setCountryQuery] = useState("");
  const paramString = params.toString();

  useEffect(() => {
    setDraft(filterDraftFromParams(params));
  }, [paramString, params]);

  const activeDecade = activeDecadeFromDraft(draft);

  const appliedDraft = useMemo(() => filterDraftFromParams(params), [params]);

  const chips = useMemo(() => {
    const items: Array<{ label: string; next: FilterDraft }> = [];
    if (appliedDraft.genre) {
      const genre = MOVIE_GENRES.find((item) => String(item.id) === appliedDraft.genre);
      items.push({
        label: genre?.name ?? `Genre ${appliedDraft.genre}`,
        next: { ...appliedDraft, genre: "" },
      });
    }
    if (appliedDraft.language) {
      items.push({
        label: LANGUAGES.find((item) => item.code === appliedDraft.language)?.name ?? appliedDraft.language,
        next: { ...appliedDraft, language: "" },
      });
    }
    if (appliedDraft.country) {
      items.push({
        label: findCountry(appliedDraft.country)?.name ?? appliedDraft.country,
        next: { ...appliedDraft, country: "" },
      });
    }
    if (appliedDraft.year) {
      items.push({
        label: appliedDraft.year,
        next: { ...appliedDraft, year: "" },
      });
    }
    const appliedDecade = activeDecadeFromDraft(appliedDraft);
    if (appliedDecade != null) {
      items.push({
        label: `${appliedDecade}s`,
        next: { ...appliedDraft, yearGte: "", yearLte: "" },
      });
    }
    if (appliedDraft.ratingGte) {
      items.push({
        label: `TMDB ${appliedDraft.ratingGte}+`,
        next: { ...appliedDraft, ratingGte: "" },
      });
    }
    if (appliedDraft.sort && appliedDraft.sort !== "popularity") {
      items.push({
        label: `Sort: ${SORT_LABELS[appliedDraft.sort] ?? appliedDraft.sort}`,
        next: { ...appliedDraft, sort: "popularity" },
      });
    }
    return items;
  }, [appliedDraft]);

  const activeFilterCount = countActiveFilters(appliedDraft);

  const filteredCountries = useMemo(() => searchCountries(countryQuery), [countryQuery]);

  function patchDraft(patch: Partial<FilterDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function applyDraft(next: FilterDraft) {
    setDraft(next);
    onNavigate?.();
    router.push(buildMoviesHrefFromDraft(next));
    setOpen(false);
  }

  function applyFilters() {
    applyDraft(draft);
  }

  function clearAll() {
    setDraft(emptyFilterDraft());
    setCountryQuery("");
    onNavigate?.();
    router.push("/movies");
    setOpen(false);
  }

  function setDecade(decade: number) {
    setDraft((current) => {
      const active = activeDecadeFromDraft(current);
      if (active === decade) {
        return { ...current, yearGte: "", yearLte: "" };
      }
      return {
        ...current,
        year: "",
        yearGte: String(decade),
        yearLte: String(decade + 9),
      };
    });
  }

  const panel = (
    <div className="filter-drawer__panel">
      <div className="filter-drawer__header">
        <h2 className="filter-drawer__title">Browse catalog</h2>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost text-sm lg:hidden">
          Close
        </button>
      </div>

      <div className="filter-drawer__tabs" role="tablist" aria-label="Filter sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "filters"}
          className={`filter-drawer__tab ${tab === "filters" ? "is-active" : ""}`}
          onClick={() => setTab("filters")}
        >
          Filters
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "regions"}
          className={`filter-drawer__tab ${tab === "regions" ? "is-active" : ""}`}
          onClick={() => setTab("regions")}
        >
          Regions
        </button>
      </div>

      {tab === "filters" ? (
        <>
          <div className="filter-drawer__grid">
            <label className="filter-field">
              <span>Genre</span>
              <select
                value={draft.genre}
                onChange={(event) => patchDraft({ genre: event.target.value })}
                data-testid="filter-genre"
              >
                <option value="">All genres</option>
                {MOVIE_GENRES.map((genre) => (
                  <option key={genre.id} value={genre.id}>{genre.name}</option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>Year</span>
              <input
                type="number"
                placeholder="e.g. 2007"
                value={draft.year}
                onChange={(event) =>
                  patchDraft({ year: event.target.value, yearGte: "", yearLte: "" })
                }
              />
            </label>
            <label className="filter-field">
              <span>Language</span>
              <select
                value={draft.language}
                onChange={(event) => patchDraft({ language: event.target.value })}
                data-testid="filter-language"
              >
                <option value="">All languages</option>
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>{language.name}</option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>Minimum TMDB rating</span>
              <select
                value={draft.ratingGte}
                onChange={(event) => patchDraft({ ratingGte: event.target.value })}
                data-testid="filter-rating"
              >
                <option value="">Any rating</option>
                {[9, 8, 7, 6].map((value) => (
                  <option key={value} value={value}>{value}+</option>
                ))}
              </select>
            </label>
            <label className="filter-field filter-field--wide">
              <span>Sort by</span>
              <select
                value={draft.sort}
                onChange={(event) => patchDraft({ sort: event.target.value })}
                data-testid="filter-sort"
              >
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
                  className={`filter-chip ${activeDecade === decade ? "is-active" : ""}`}
                  onClick={() => setDecade(decade)}
                >
                  {decade}s
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="filter-drawer__regions">
          <p className="text-sm text-[var(--text-secondary)]">
            Filter by production country — pulls real titles from TMDB&apos;s global catalog.
          </p>
          <input
            type="search"
            className="filter-drawer__country-search"
            placeholder="Search countries…"
            value={countryQuery}
            onChange={(event) => setCountryQuery(event.target.value)}
            aria-label="Search countries"
          />
          <button
            type="button"
            className={`filter-chip ${!draft.country ? "is-active" : ""}`}
            onClick={() => patchDraft({ country: "" })}
          >
            All countries
          </button>
          {countryQuery ? (
            <div className="filter-drawer__country-list">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={`filter-chip ${draft.country === country.code ? "is-active" : ""}`}
                  onClick={() => patchDraft({ country: country.code })}
                >
                  {country.name}
                </button>
              ))}
            </div>
          ) : (
            COUNTRY_CONTINENTS.map((continent) => {
              const countries = countriesByContinent(continent);
              if (!countries.length) return null;
              return (
                <div key={continent} className="filter-drawer__continent">
                  <p className="eyebrow">{continent}</p>
                  <div className="filter-drawer__country-list">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        className={`filter-chip ${draft.country === country.code ? "is-active" : ""}`}
                        onClick={() => patchDraft({ country: country.code })}
                      >
                        {country.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="filter-drawer__actions">
        <button type="button" onClick={clearAll} className="btn btn-ghost" data-testid="movie-filter-clear">
          Clear all
        </button>
        <button type="button" onClick={applyFilters} className="btn btn-primary" data-testid="movie-filter-apply">
          Apply filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="filter-drawer" data-testid="movie-filters">
      <div className="filter-drawer__toolbar">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary lg:hidden">
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </button>
        <div className="hidden lg:block lg:flex-1">{panel}</div>
      </div>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => applyDraft(chip.next)}
              className="filter-chip is-active"
            >
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
