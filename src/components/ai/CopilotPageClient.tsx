"use client";

import { CopilotChat } from "@/components/ai/CopilotChat";
import { useSearchParams } from "next/navigation";

export function CopilotPageClient() {
  const params = useSearchParams();
  return <CopilotChat initialQuery={params.get("q")} />;
}
