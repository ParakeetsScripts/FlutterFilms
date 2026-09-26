import { OpenModelsHub } from "@/components/ai/OpenModelsHub";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Models",
  description: `Self-hosted and open-weight AI models for ${SITE_NAME}.`,
};

export default function OpenModelsPage() {
  return (
    <div className="page-container page-section">
      <OpenModelsHub />
    </div>
  );
}
