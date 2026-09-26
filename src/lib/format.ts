export function formatReleaseBadge(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .replace(".", "")
    .toUpperCase();
}

export function formatProgressPercent(position: number, duration: number): number {
  if (!duration) return 0;
  return Math.min(100, Math.round((position / duration) * 100));
}
