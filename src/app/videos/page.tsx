import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videos",
  description: `Video studio for ${SITE_NAME}.`,
};

export default function VideosPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Studio</p>
        <h1 className="page-header__title">Videos</h1>
        <p className="page-header__subtitle">
          Cloud and self-hosted video generation. LLMs do not generate video — only configured video backends are listed.
        </p>
      </header>
      <div className="mt-10 ai-usage-card">
        <h2 className="section-title">Provider-ready architecture</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Self-hosted video models will appear here only when an administrator configures a compatible inference server.
        </p>
      </div>
    </div>
  );
}
