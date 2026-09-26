import { DEVELOPER_CREDIT, SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";

export default function AboutPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">About</p>
        <h1 className="page-header__title">{SITE_FULL_NAME}</h1>
      </header>
      <div className="max-w-2xl space-y-6 text-[var(--text-secondary)] leading-relaxed">
        <p>
          {SITE_NAME} is a premium movie discovery library. TMDB provides metadata and imagery; IMDb contributes
          ratings through official datasets. This application is not endorsed by TMDB and does not host films.
        </p>
        <p>
          Metadata synchronizes automatically on a schedule — ratings, posters, and availability update in the database
          without redeploying the site.
        </p>
        <p>
          Playback is limited to authorized sources: official trailers, legal deep links, or media you already own.
        </p>
        <p className="text-sm text-[var(--text-muted)]">{DEVELOPER_CREDIT}</p>
      </div>
    </div>
  );
}
