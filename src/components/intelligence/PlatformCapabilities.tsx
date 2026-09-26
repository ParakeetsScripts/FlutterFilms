import Link from "next/link";

type Props = {
  stats: { live: number; beta: number; planned: number };
  featureCount: number;
};

const COMPARISON = [
  {
    area: "Catalog + playback",
    flutter: "TMDB + IMDb sync, authorized playback only, local SQLite + Neon Postgres",
    tmdb: "Metadata API; no personal library or playback",
    imdb: "Ratings/reviews focus; no unified watch experience",
  },
  {
    area: "AI intelligence",
    flutter: `${100} registered capabilities with computed live/beta/planned status and trust labeling`,
    tmdb: "No native AI discovery or taste engine",
    imdb: "No personalized AI movie agent",
  },
  {
    area: "Trust layer",
    flutter: "Verified catalog facts vs AI interpretation vs predictions — always labeled",
    tmdb: "Factual metadata; no AI interpretation layer",
    imdb: "User reviews; limited structured trust for AI outputs",
  },
  {
    area: "Personalization",
    flutter: "Taste DNA, watchlist, history, franchises, rooms — persisted per user/device",
    tmdb: "Lists require TMDB account; no taste DNA",
    imdb: "Watchlist/ratings; no cross-feature taste graph",
  },
  {
    area: "Local AI",
    flutter: "Ollama / OpenAI-compatible endpoints with honest unavailable states",
    tmdb: "N/A",
    imdb: "N/A",
  },
  {
    area: "Operations",
    flutter: "Feature health, telemetry, admin ops — real metrics only",
    tmdb: "Developer API stats",
    imdb: "No feature-level product ops for consumers",
  },
];

export function PlatformCapabilities({ stats, featureCount }: Props) {
  return (
    <div>
      <header className="page-header">
        <p className="eyebrow">Why FlutterFilms</p>
        <h1 className="page-header__title">Beyond TMDB & IMDb</h1>
        <p className="page-header__subtitle">
          A production movie intelligence platform — {stats.live} verified live features of {featureCount},
          {stats.beta} in beta, {stats.planned} planned. No inflated dashboards.
        </p>
      </header>

      <div className="mt-10 overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="p-4">Area</th>
              <th className="p-4">FlutterFilms</th>
              <th className="p-4">TMDB</th>
              <th className="p-4">IMDb</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.area} className="border-b border-[var(--line)] last:border-0">
                <td className="p-4 font-medium">{row.area}</td>
                <td className="p-4 text-[var(--accent-soft)]">{row.flutter}</td>
                <td className="p-4 text-[var(--text-secondary)]">{row.tmdb}</td>
                <td className="p-4 text-[var(--text-secondary)]">{row.imdb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-10 grid gap-3 md:grid-cols-2">
        <li className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="font-medium">Zero fake functionality</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Features show “Not enough verified data” instead of invented movies, ratings, or AI output.
          </p>
        </li>
        <li className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="font-medium">Unified feature runtime</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Every capability runs through the same execution engine with health checks and telemetry.
          </p>
        </li>
        <li className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="font-medium">Cinema Agent with tools</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Factual lookups use catalog services — not fabricated answers.
          </p>
        </li>
        <li className="rounded-xl border border-[var(--line)] p-4">
          <h2 className="font-medium">Investor-ready honesty</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Live counts reflect automated validation — click any live feature to verify end-to-end.
          </p>
        </li>
      </ul>

      <div className="mt-8 flex gap-3">
        <Link href="/intelligence" className="btn btn-primary">View Intelligence Hub</Link>
        <Link href="/settings" className="btn btn-ghost">Settings</Link>
      </div>
    </div>
  );
}
