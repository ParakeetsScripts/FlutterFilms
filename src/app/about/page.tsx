import { AboutPageContent } from "@/components/about/AboutPageContent";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About ${SITE_NAME}`,
  description: `Learn how ${SITE_NAME} combines TMDB, IMDb, taste, and Cinema Agent for honest movie discovery.`,
};

export default function AboutPage() {
  return (
    <div className="page-container page-section">
      <AboutPageContent />
    </div>
  );
}
