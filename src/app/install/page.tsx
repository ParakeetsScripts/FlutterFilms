import { InstallHub } from "@/components/install/InstallHub";
import { SITE_NAME } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Install ${SITE_NAME}`,
  description: `Install ${SITE_NAME} as a web app for faster access. Offline movie streaming is not provided.`,
};

export default function InstallPage() {
  return (
    <div className="page-container page-section max-w-3xl">
      <InstallHub />
    </div>
  );
}
