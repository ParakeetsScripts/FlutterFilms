import { SharedWatchlistsView } from "@/components/watchlists/SharedWatchlistsView";
import { SITE_FULL_NAME } from "@/lib/brand";

export const metadata = {
  title: "Shared Watchlists",
  description: `Collaborative movie lists with friends on ${SITE_FULL_NAME}.`,
};

export default function WatchlistsPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Social</p>
        <h1 className="page-header__title">Shared watchlists</h1>
        <p className="page-header__subtitle">
          Build lists together. Permissions are enforced server-side — viewers cannot edit.
        </p>
      </header>
      <SharedWatchlistsView />
    </div>
  );
}
