import { MovieRoomView } from "@/components/rooms/MovieRoomView";
import { SITE_FULL_NAME, SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    title: `Movie Night — ${SITE_NAME}`,
    description: `Help us choose tonight's movie. Join this ${SITE_FULL_NAME} movie room.`,
    openGraph: {
      title: `${SITE_NAME} — Movie Night`,
      description: "Help us choose tonight's movie.",
      url: `${base}/rooms/${code}`,
      siteName: SITE_FULL_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: "Join Movie Room",
      description: `Help us choose tonight's movie on ${SITE_NAME}.`,
    },
  };
}

export default async function RoomByCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <MovieRoomView code={code} />;
}
