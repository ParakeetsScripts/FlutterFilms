export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function moviePath(id: number, title: string): string {
  const slug = slugify(title);
  return slug ? `/movie/${id}-${slug}` : `/movie/${id}`;
}

export function watchPath(id: number, title?: string): string {
  return title ? `/watch/${id}-${slugify(title)}` : `/watch/${id}`;
}

export function genrePath(id: number, name?: string): string {
  return name ? `/genre/${id}-${slugify(name)}` : `/genre/${id}`;
}

export function personPath(id: number, name?: string): string {
  return name ? `/person/${id}-${slugify(name)}` : `/person/${id}`;
}

export function collectionPath(id: number, name?: string): string {
  return name ? `/collection/${id}-${slugify(name)}` : `/collection/${id}`;
}

export function formatRuntime(minutes: number | null): string | null {
  if (minutes == null) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

export function formatVote(value: number | null): string | null {
  if (value == null) return null;
  return value.toFixed(1);
}
