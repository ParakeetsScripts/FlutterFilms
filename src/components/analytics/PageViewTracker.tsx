"use client";

import { initVercelAnalytics } from "@/lib/analytics/providers";
import { trackPageView } from "@/lib/analytics/track";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    initVercelAnalytics();
  }, []);
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}
