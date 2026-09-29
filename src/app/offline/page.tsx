import { OfflineRetry } from "@/components/pwa/OfflineRetry";
import { SITE_NAME } from "@/lib/brand";

export const metadata = {
  title: "Offline",
  description: `You are offline. ${SITE_NAME} can show cached pages but does not stream movies offline.`,
};

export default function OfflinePage() {
  return (
    <div className="page-container page-section max-w-xl">
      <header className="page-header">
        <h1 className="page-header__title">You&apos;re offline</h1>
        <p className="page-header__subtitle">
          {SITE_NAME} can keep a lightweight app shell cached for faster reopening. Movie metadata and personalized
          features need a network connection — {SITE_NAME} does not provide offline movie streaming.
        </p>
      </header>
      <OfflineRetry />
    </div>
  );
}
