export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseMovieId(value: string | number | null | undefined): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value !== "string") throw new ValidationError("Invalid movie ID.");
  const match = value.trim().match(/^(\d+)/);
  if (!match) throw new ValidationError("Invalid movie ID.");
  const id = Number(match[1]);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Invalid movie ID.");
  return id;
}

export function parsePage(value: string | null | undefined, fallback = 1): number {
  if (value == null || value === "") return fallback;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    throw new ValidationError("Page must be between 1 and 500.");
  }
  return page;
}

export function parseQuery(value: string | null | undefined): string {
  const query = (value ?? "").trim();
  if (!query) throw new ValidationError("Search query is required.");
  if (query.length > 200) throw new ValidationError("Search query is too long.");
  return query;
}

export function parseOptionalQuery(value: string | null | undefined): string | undefined {
  const query = (value ?? "").trim();
  if (!query) return undefined;
  if (query.length > 200) throw new ValidationError("Search query is too long.");
  return query;
}

export function parseYear(value: string | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1870 || year > 2100) {
    throw new ValidationError("Year must be between 1870 and 2100.");
  }
  return year;
}

export function parseRating(value: string | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    throw new ValidationError("Rating must be between 0 and 10.");
  }
  return rating;
}

export function parseLanguage(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(value)) {
    throw new ValidationError("Invalid language code.");
  }
  return value;
}

export function parseRegion(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!/^[A-Z]{2}$/.test(value)) {
    throw new ValidationError("Invalid region code.");
  }
  return value;
}

export function parseGenreId(value: string | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Invalid genre ID.");
  return id;
}

export function parseSort(value: string | null | undefined): "popularity" | "rating" | "release_date" | "title" {
  if (!value) return "popularity";
  if (value === "popularity" || value === "rating" || value === "release_date" || value === "title") {
    return value;
  }
  throw new ValidationError("Invalid sort.");
}
