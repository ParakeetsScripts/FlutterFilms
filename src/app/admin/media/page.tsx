import { AdminMediaDashboard } from "@/components/admin/AdminMediaDashboard";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media pipeline",
  description: `Upload, transcode, and deliver authorized VOD streams for ${SITE_NAME}.`,
};

export default function AdminMediaPage() {
  return (
    <div className="page-container page-section max-w-5xl">
      <header className="page-header">
        <p className="eyebrow">Streaming infrastructure</p>
        <h1 className="page-header__title">VOD Media Pipeline</h1>
        <p className="page-header__subtitle">
          Chunked upload, HLS transcoding, signed delivery, and playback resolver integration — the pieces from a
          production streaming stack, scoped to authorized content only.
        </p>
      </header>
      <div className="mt-8">
        <AdminMediaDashboard />
      </div>
    </div>
  );
}
