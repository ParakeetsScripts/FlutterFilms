import { SharedWatchlistDetail } from "@/components/watchlists/SharedWatchlistDetail";

export default async function WatchlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="page-container page-section">
      <SharedWatchlistDetail watchlistId={id} />
    </div>
  );
}
