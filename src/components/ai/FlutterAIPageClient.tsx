"use client";

import { CopilotChat } from "@/components/ai/CopilotChat";
import { useSearchParams } from "next/navigation";

export function FlutterAIPageClient() {
  const params = useSearchParams();
  const movieParam = params.get("movie");
  const movieId = movieParam ? Number(movieParam) : undefined;
  const spoilerParam = params.get("spoiler");
  const spoilerLevels = new Set(["none", "light", "moderate", "full"]);
  const initialSpoilerLevel =
    spoilerParam && spoilerLevels.has(spoilerParam)
      ? (spoilerParam as "none" | "light" | "moderate" | "full")
      : undefined;

  return (
    <CopilotChat
      initialQuery={params.get("q")}
      initialSpoilerLevel={initialSpoilerLevel}
      movieId={Number.isFinite(movieId) ? movieId : undefined}
    />
  );
}
