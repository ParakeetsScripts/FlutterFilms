import { WatchExperience } from "@/components/player/WatchExperience";
import { MovieRow } from "@/components/movie/MovieRow";
import { PageError } from "@/components/ui/States";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { resolvePlayback } from "@/lib/playback/resolver";
import { getPosterUrl } from "@/lib/tmdb/images";
import { getMovie } from "@/lib/tmdb/movies";
import { getRecommendations } from "@/lib/tmdb/recommendations";
import { parseMovieId } from "@/lib/validation";
import { notFound } from "next/navigation";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  let movie;
  try {
    const catalog = await getServerCatalogPreferences();
    movie = await getMovie(parseMovieId((await params).id), {
      language: catalog.uiLanguage,
      region: catalog.region,
    });
  } catch {
    return <PageError />;
  }
  if (!movie) notFound();

  const [playback, recs] = await Promise.all([
    resolvePlayback(movie.id),
    getRecommendations(movie.id).catch(() => ({ results: [] })),
  ]);

  return (
    <div>
      <WatchExperience
        movie={movie}
        playback={playback}
        posterUrl={getPosterUrl(movie.posterPath, "w780") ?? undefined}
      />
      <div className="page-container page-section">
        <MovieRow title="You may also like" movies={recs.results.slice(0, 8)} />
      </div>
    </div>
  );
}
