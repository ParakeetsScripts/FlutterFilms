import { FlutterAIPageClient } from "@/components/ai/FlutterAIPageClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "FlutterAI",
  description: "Source-grounded movie intelligence and conversation for FlutterFilms.",
};

export default function FlutterAIPage() {
  return (
    <div className="page-container page-section">
      <Suspense>
        <FlutterAIPageClient />
      </Suspense>
    </div>
  );
}
