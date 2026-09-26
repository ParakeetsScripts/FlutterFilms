import { AboutPageContent } from "@/components/about/AboutPageContent";
import { SITE_NAME } from "@/lib/brand";
import { getValidatedFeatures } from "@/lib/ai/features/validate";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `About ${SITE_NAME}`,
  description: `Learn how ${SITE_NAME} combines TMDB, IMDb, taste, and Cinema Agent for honest movie discovery.`,
};

export default function AboutPage() {
  const features = getValidatedFeatures().map((f) => ({
    id: f.id,
    slug: f.slug,
    title: f.title,
    category: f.category,
    description: f.description,
    status: f.status,
    route: f.route,
  }));

  return (
    <div className="page-container page-section about-page">
      <header className="page-header about-page__header">
        <p className="eyebrow">About</p>
        <h1 id="about-page-title" className="page-header__title mt-2">About {SITE_NAME}</h1>
        <p className="page-header__subtitle font-serif text-xl text-[var(--text-primary)]">
          A smarter way to discover movies.
        </p>
      </header>
      <AboutPageContent features={features} />
    </div>
  );
}
