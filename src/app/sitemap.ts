import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/discover",
    "/copilot",
    "/tonight",
    "/my-cinema",
    "/watchlist",
    "/community",
    "/movies",
    "/people",
    "/franchises",
    "/intelligence",
    "/install",
    "/demo",
    "/about",
  ];
  const now = new Date();
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
