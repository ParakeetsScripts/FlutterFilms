import type { CreditPerson, Movie, MovieSummary } from "@/lib/tmdb/types";

export function dedupeMovies<T extends { id: number }>(movies: T[], limit = 8): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const movie of movies) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    out.push(movie);
    if (out.length >= limit) break;
  }
  return out;
}

export function castRoleLine(person: CreditPerson): string | null {
  const role = person.character?.trim();
  if (!role) return null;
  if (role.toLowerCase() === person.name.toLowerCase()) return null;
  return role;
}

export function formatCurrency(value: number | null): string | null {
  if (value == null || value <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatReleaseMonth(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
}

export function languageLabel(movie: Movie, code: string | null): string | null {
  if (!code) return null;
  const spoken = movie.spokenLanguages.find((l) => l.iso === code);
  if (spoken) return spoken.name;
  return code.toUpperCase();
}

export function heroSynopsis(overview: string | null, max = 280): string | null {
  if (!overview) return null;
  if (overview.length <= max) return overview;
  return `${overview.slice(0, max).trim()}…`;
}
