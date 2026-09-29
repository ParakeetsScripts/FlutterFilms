import { MovieViewTracker } from "@/components/analytics/MovieViewTracker";
import { MovieDetailView } from "@/components/movie/detail/MovieDetailView";
import { dedupeMovies } from "@/lib/movie/detail-helpers";
import { watchLabel } from "@/lib/playback/labels";
import { resolvePlayback } from "@/lib/playback/resolver";
import { getServerCatalogPreferences } from "@/lib/catalog/server";
import { getMovie } from "@/lib/tmdb/movies";
import { getRecommendations } from "@/lib/tmdb/recommendations";
import { getSimilarMovies } from "@/lib/tmdb/similar";
import { getBackdropUrl } from "@/lib/tmdb/images";
import { moviePath, watchPath } from "@/lib/slug";
import { parseMovieId } from "@/lib/validation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 1800;

async function movieLoadOptions() {
  const catalog = await getServerCatalogPreferences();
  return { language: catalog.uiLanguage, region: catalog.region };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const movie = await getMovie(parseMovieId((await params).id), await movieLoadOptions());
    if (!movie) return { title: "Movie" };
    const title = movie.year ? `${movie.title} (${movie.year})` : movie.title;
    return {
      title,
      description: movie.overview ?? undefined,
      alternates: { canonical: moviePath(movie.id, movie.title) },
      openGraph: {
        title,
        description: movie.overview ?? undefined,
        images: getBackdropUrl(movie.backdropPath, "w1280") ? [getBackdropUrl(movie.backdropPath, "w1280")!] : undefined,
      },
    };
  } catch {
    return { title: "Movie" };
  }
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const tmdbId = parseMovieId((await params).id);

  const movie = await getMovie(tmdbId, await movieLoadOptions());
  if (!movie) notFound();

  const [recs, similar, playback] = await Promise.all([
    getRecommendations(movie.id).catch(() => ({ results: [] })),
    getSimilarMovies(movie.id).catch(() => ({ results: [] })),
    resolvePlayback(movie.id).catch(() => null),
  ]);

  const watchHref =
    playback?.status === "PLAYABLE" || playback?.status === "TRAILER_ONLY"
      ? watchPath(movie.id, movie.title)
      : playback?.source?.url;

  return (
    <>
      <MovieViewTracker movieId={movie.id} />
      <MovieDetailView
        movie={movie}
        recommendations={dedupeMovies(recs.results, 12)}
        similar={dedupeMovies(similar.results, 12)}
        playbackLabel={playback ? watchLabel(playback.status) : "Where to watch"}
        playbackHref={watchHref}
      />
    </>
  );
}
