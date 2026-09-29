export type FilterDraft = {
  genre: string;
  year: string;
  language: string;
  country: string;
  ratingGte: string;
  sort: string;
  yearGte: string;
  yearLte: string;
};

export function emptyFilterDraft(): FilterDraft {
  return {
    genre: "",
    year: "",
    language: "",
    country: "",
    ratingGte: "",
    sort: "popularity",
    yearGte: "",
    yearLte: "",
  };
}

export function filterDraftFromParams(params: URLSearchParams): FilterDraft {
  const languageParam = params.get("language");
  return {
    genre: params.get("genre") ?? "",
    year: params.get("year") ?? "",
    language: languageParam === "all" || !languageParam ? "" : languageParam,
    country: params.get("country") ?? "",
    ratingGte: params.get("ratingGte") ?? "",
    sort: params.get("sort") ?? "popularity",
    yearGte: params.get("yearGte") ?? "",
    yearLte: params.get("yearLte") ?? "",
  };
}

/** Build `/movies` URL from a committed filter draft. */
export function buildMoviesHrefFromDraft(draft: FilterDraft): string {
  const params = new URLSearchParams();

  if (draft.genre) params.set("genre", draft.genre);
  if (draft.year) {
    params.set("year", draft.year);
  } else if (draft.yearGte && draft.yearLte) {
    params.set("yearGte", draft.yearGte);
    params.set("yearLte", draft.yearLte);
  }
  if (draft.language) params.set("language", draft.language);
  if (draft.country) params.set("country", draft.country);
  if (draft.ratingGte) params.set("ratingGte", draft.ratingGte);
  if (draft.sort && draft.sort !== "popularity") params.set("sort", draft.sort);

  const query = params.toString();
  return query ? `/movies?${query}` : "/movies";
}

export function activeDecadeFromDraft(draft: FilterDraft): number | null {
  if (!draft.yearGte || !draft.yearLte || draft.year) return null;
  const start = Number(draft.yearGte);
  const end = Number(draft.yearLte);
  if (!Number.isInteger(start) || end !== start + 9) return null;
  return start;
}
