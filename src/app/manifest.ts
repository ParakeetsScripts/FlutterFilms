import type { MetadataRoute } from "next";
import { SITE_FULL_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_FULL_NAME,
    short_name: SITE_NAME,
    description: `${SITE_TAGLINE} Discover what to watch tonight.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    background_color: "#0a0a0c",
    theme_color: "#4a9eff",
    orientation: "any",
    categories: ["entertainment", "movies"],
    icons: [
      ...ICON_SIZES.map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: size === 192 || size === 512 ? ("maskable" as const) : ("any" as const),
      })),
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
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
