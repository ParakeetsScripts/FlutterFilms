import { HomeView } from "@/components/home/HomeView";
import { PageError } from "@/components/ui/States";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { loadHomeData } from "@/lib/home";
import { watchLabel } from "@/lib/playback/labels";
import { resolvePlayback } from "@/lib/playback/resolver";
import { watchPath } from "@/lib/slug";
import { TmdbConfigError, TmdbUnavailableError } from "@/lib/tmdb/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const catalog = await getServerCatalogPreferences();
    const data = await loadHomeData(catalog);
    const playback = await resolvePlayback(data.featured.id).catch(() => null);
    const defaultPlayback = {
      label: playback ? watchLabel(playback.status) : "Where to watch",
      href:
        playback?.status === "PLAYABLE" || playback?.status === "TRAILER_ONLY"
          ? watchPath(data.featured.id, data.featured.title)
          : playback?.source?.type === "external"
            ? playback.source.url
            : undefined,
    };

    return <HomeView data={data} defaultPlayback={defaultPlayback} />;
  } catch (error) {
    if (error instanceof TmdbConfigError) {
      return <PageError message="Add TMDB_API_TOKEN or TMDB_API_KEY to enable movie data." />;
    }
    if (error instanceof TmdbUnavailableError) {
      return <PageError />;
    }
    return <PageError />;
  }
}
