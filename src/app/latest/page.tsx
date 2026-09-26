import { LatestTabs } from "@/components/latest/LatestTabs";
import { getLatestSections } from "@/lib/sync/catalog";
import { getUpcomingMovies } from "@/lib/tmdb/movies";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Latest",
  description: `Recently added, released and updated on ${SITE_NAME}.`,
};

export default async function LatestPage() {
  const { updated, added } = await getLatestSections();
  const upcoming = await getUpcomingMovies(1).catch(() => ({ results: [] }));

  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Fresh</p>
        <h1 className="page-header__title">Latest</h1>
        <p className="page-header__subtitle">
          Recently added, released, and updated titles. Metadata refreshes automatically — no redeploy required.
        </p>
      </header>
      <LatestTabs updated={updated} added={added} upcoming={upcoming.results} />
    </div>
  );
}
