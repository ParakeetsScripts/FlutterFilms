"use client";

import { FEATURED_GENRES, LANGUAGES } from "@/lib/regions";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const chips = useMemo(() => {
    const items: Array<{ label: string; key: string }> = [];
    const genre = params.get("genre");
    const language = params.get("language");
    const year = params.get("year");
    const rating = params.get("ratingGte");
    if (genre) items.push({ label: FEATURED_GENRES.find((item) => String(item.id) === genre)?.name ?? `Genre ${genre}`, key: "genre" });
    if (language) items.push({ label: LANGUAGES.find((item) => item.code === language)?.name ?? language, key: "language" });
    if (year) items.push({ label: year, key: "year" });
    if (rating) items.push({ label: `Rating ${rating}+`, key: "ratingGte" });
    return items;
  }, [params]);

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    router.push(`/movies?${next.toString()}`);
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <select defaultValue={params.get("genre") ?? ""} onChange={(event) => update("genre", event.target.value)} className="bg-[#141414] px-3 py-2 text-sm">
          <option value="">All genres</option>
          {FEATURED_GENRES.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
        <select defaultValue={params.get("language") ?? ""} onChange={(event) => update("language", event.target.value)} className="bg-[#141414] px-3 py-2 text-sm">
          <option value="">All languages</option>
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Year"
          defaultValue={params.get("year") ?? ""}
          onBlur={(event) => update("year", event.target.value)}
          className="bg-[#141414] px-3 py-2 text-sm"
        />
        <select defaultValue={params.get("sort") ?? "popularity"} onChange={(event) => update("sort", event.target.value)} className="bg-[#141414] px-3 py-2 text-sm">
          <option value="popularity">Popularity</option>
          <option value="rating">Rating</option>
          <option value="release_date">Release date</option>
          <option value="title">Title</option>
        </select>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => update(chip.key, "")} className="border border-[var(--gold)] px-3 py-1 text-sm text-[var(--gold-soft)]">
              {chip.label} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
