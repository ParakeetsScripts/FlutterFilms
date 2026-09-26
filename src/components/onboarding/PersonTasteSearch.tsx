"use client";

import { getProfileUrl } from "@/lib/tmdb/images";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type { PersonTasteItem } from "@/lib/onboarding/types";
import { useCallback, useState } from "react";

type SearchResponse = { people: PersonTasteItem[] };

export function PersonTasteSearch({
  selected,
  onSelect,
  onRemove,
}: {
  selected: PersonTasteItem[];
  onSelect: (person: PersonTasteItem) => boolean;
  onRemove: (id: number) => void;
}) {
  const [query, setQuery] = useState("");

  const fetcher = useCallback(async (q: string) => {
    const r = await fetch(`/api/onboarding/search?q=${encodeURIComponent(q)}&type=person`);
    if (!r.ok) throw new Error("search failed");
    return (await r.json()) as SearchResponse;
  }, []);

  const { results, loading, error } = useDebouncedSearch(query, fetcher);
  const people = results?.people ?? [];
  const selectedIds = new Set(selected.map((p) => p.id));

  return (
    <div className="onboarding-people">
      <label className="sr-only" htmlFor="onboarding-person-search">Search filmmakers or actors</label>
      <input
        id="onboarding-person-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search filmmakers or actors…"
        className="onboarding-search-input"
        autoComplete="off"
      />
      {loading && <p className="onboarding-hint" role="status">Searching…</p>}
      {error && <p className="onboarding-error">{error}</p>}
      {people.length > 0 && (
        <ul className="onboarding-search-results onboarding-search-results--people">
          {people.map((person) => {
            const isSelected = selectedIds.has(person.id);
            return (
              <li key={person.id}>
                <button
                  type="button"
                  className={`onboarding-search-result ${isSelected ? "is-selected" : ""}`}
                  onClick={() => !isSelected && onSelect(person)}
                  disabled={isSelected}
                >
                  <img
                    src={getProfileUrl(person.profilePath, "w185") ?? "/placeholder-profile.svg"}
                    alt=""
                    className="onboarding-search-result__poster onboarding-search-result__poster--round"
                    loading="lazy"
                  />
                  <div className="onboarding-search-result__meta">
                    <span className="onboarding-search-result__title">{person.name}</span>
                    {person.department ? (
                      <span className="onboarding-search-result__sub">{person.department}</span>
                    ) : null}
                  </div>
                  {isSelected ? <span className="onboarding-search-result__check">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected.length > 0 && (
        <ul className="onboarding-selected-list mt-4">
          {selected.map((person) => (
            <li key={person.id} className="onboarding-selected-chip">
              <span>{person.name}</span>
              <button type="button" className="onboarding-selected-chip__remove" onClick={() => onRemove(person.id)} aria-label={`Remove ${person.name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
