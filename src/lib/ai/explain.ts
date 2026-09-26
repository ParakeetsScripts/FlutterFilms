import type { TasteSignal } from "@/lib/user/taste-repository";

export function buildRecommendationExplanation(signals: TasteSignal[]): string[] {
  const reasons: string[] = [];
  const genres = signals.filter((s) => s.signalKey === "genre").slice(0, 2);
  const runtime = signals.find((s) => s.signalKey === "runtime_pref");
  const decade = signals.find((s) => s.signalKey === "decade");

  if (genres.length) {
    reasons.push(`You often watch ${genres.map((g) => g.signalValue).join(" and ")} films`);
  }
  if (runtime) {
    reasons.push(`You usually prefer movies around ${runtime.signalValue} minutes`);
  }
  if (decade) {
    reasons.push(`You frequently explore films from the ${decade.signalValue}s`);
  }

  return reasons.slice(0, 4);
}
