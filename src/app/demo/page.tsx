import Link from "next/link";

const SHOWCASE = [
  { href: "/copilot", title: "AI Copilot", desc: "Tool-using Cinema Agent with catalog-backed answers" },
  { href: "/tonight", title: "Tonight Picker", desc: "One primary pick + two alternatives with explanations" },
  { href: "/my-cinema", title: "Taste DNA", desc: "Persistent taste profile from real library data" },
  { href: "/intelligence/remember-wizard", title: "Scene Memory", desc: "Identify films from vague scene descriptions" },
  { href: "/rooms", title: "Group Room", desc: "Collaborative movie night decisions" },
  { href: "/watchlist", title: "Shared Watchlists", desc: "Collaborative lists with permissions (sign in)" },
  { href: "/movie/13885", title: "Movie Intelligence", desc: "Briefings, themes, and trust-labeled analysis" },
  { href: "/images", title: "Image Studio", desc: "AI-generated concept artwork with job history" },
  { href: "/videos", title: "Video Studio", desc: "Honest provider workflow — no fake outputs" },
];

export default function DemoPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Investor demo</p>
        <h1 className="page-header__title">FlutterFilms Demo</h1>
        <p className="page-header__subtitle">
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs uppercase tracking-wider text-amber-200">
            Demo Account
          </span>
          {" "}— uses real catalog data. Preconfigured preferences may be shown for showcase; this is not real user activity.
        </p>
      </header>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE.map((item) => (
          <Link key={item.href} href={item.href} className="ai-feature-card block hover:border-[var(--accent-soft)]">
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
            <span className="mt-4 inline-block text-sm text-[var(--accent-soft)]">Open →</span>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-sm text-[var(--text-muted)]">
        Sign in with a demo account from your deployment configuration, or explore anonymously with local library data.
      </p>
    </div>
  );
}
