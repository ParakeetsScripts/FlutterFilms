import { MyCinemaView } from "@/components/my-cinema/MyCinemaView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Cinema",
  description: "Your personal vault: Taste DNA, weekly briefs, and your cinematic identity, built from your own library.",
};

export default function MyCinemaPage() {
  return <MyCinemaView />;
}
