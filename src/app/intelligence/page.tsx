import { IntelligenceHub } from "@/components/intelligence/IntelligenceHub";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence",
  description: `AI Cinema Intelligence for ${SITE_NAME}.`,
};

export default function IntelligencePage() {
  return <IntelligenceHub />;
}
