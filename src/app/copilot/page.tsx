import { CopilotChat } from "@/components/ai/CopilotChat";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Copilot",
  description: `Movie intelligence copilot for ${SITE_NAME}.`,
};

export default function CopilotPage() {
  return (
    <div className="page-container page-section">
      <CopilotChat />
    </div>
  );
}
