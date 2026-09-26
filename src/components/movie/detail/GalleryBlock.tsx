"use client";

import { Drawer } from "@/components/ui/Drawer";
import { getBackdropUrl } from "@/lib/tmdb/images";
import type { Artwork } from "@/lib/tmdb/types";
import { useEffect, useState } from "react";

export function GalleryBlock({
  title,
  backdrops,
}: {
  title: string;
  backdrops: Artwork[];
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const preview = backdrops.slice(0, 6);

  useEffect(() => {
    if (lightbox == null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((i) => (i == null ? null : Math.min(backdrops.length - 1, i + 1)));
      if (event.key === "ArrowLeft") setLightbox((i) => (i == null ? null : Math.max(0, i - 1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, backdrops.length]);

  if (!preview.length) return null;

  return (
    <section className="detail-section">
      <div className="detail-section__header">
        <h2 className="section-title">Gallery</h2>
        {backdrops.length > preview.length && (
          <button type="button" className="detail-link" onClick={() => setDrawerOpen(true)}>
            View gallery →
          </button>
        )}
      </div>
      <div className="gallery-preview">
        {preview.map((image, index) => (
          <button
            key={image.filePath}
            type="button"
            className="gallery-preview__item"
            onClick={() => setLightbox(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getBackdropUrl(image.filePath, "w780") ?? ""} alt={`${title} still ${index + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {lightbox != null && (
        <div className="gallery-lightbox" role="dialog" aria-label="Gallery">
          <button type="button" className="gallery-lightbox__close" onClick={() => setLightbox(null)}>Close</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getBackdropUrl(backdrops[lightbox].filePath, "w1280") ?? ""}
            alt={`${title} still`}
            className="gallery-lightbox__image"
          />
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Gallery">
        <div className="gallery-drawer-grid">
          {backdrops.map((image, index) => (
            <button key={image.filePath} type="button" onClick={() => { setDrawerOpen(false); setLightbox(index); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getBackdropUrl(image.filePath, "w780") ?? ""} alt="" className="rounded-md" />
            </button>
          ))}
        </div>
      </Drawer>
    </section>
  );
}
