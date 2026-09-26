import type { MetadataRoute } from "next";
import { SITE_FULL_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_FULL_NAME,
    short_name: SITE_NAME,
    description: `${SITE_TAGLINE} Discover what to watch tonight.`,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#4a9eff",
    orientation: "portrait-primary",
    categories: ["entertainment", "movies"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
