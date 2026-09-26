import { CreativeStudio } from "@/components/intelligence/CreativeStudio";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Images",
  description: `AI creative studio for ${SITE_NAME}.`,
};

export default function ImagesPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Studio</p>
        <h1 className="page-header__title">Creative Studio</h1>
        <p className="page-header__subtitle">
          Posters, movie night cards, timelines, and review outlines — clearly labeled as AI-generated concepts.
        </p>
      </header>
      <div className="mt-10">
        <CreativeStudio />
      </div>
    </div>
  );
}
