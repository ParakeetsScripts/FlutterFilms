const metrics = new Map<string, number>();

/** Development-only timing channel read by the cinematic debug overlay. */
export function recordMetric(name: string, value: number) {
  if (process.env.NODE_ENV === "production") return;
  metrics.set(name, Math.round(value));
}

export function readMetrics(): Array<[string, number]> {
  return [...metrics.entries()];
}
