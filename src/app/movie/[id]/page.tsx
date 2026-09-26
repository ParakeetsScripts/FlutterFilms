import { MovieViewTracker } from "@/components/analytics/MovieViewTracker";
import { MovieDetailView } from "@/components/movie/detail/MovieDetailView";
import { ShareActions } from "@/components/share/ShareActions";
import { PageError } from "@/components/ui/States";
import { dedupeMovies } from "@/lib/movie/detail-helpers";
import { watchLabel } from "@/lib/playback/labels";
import { resolvePlayback } from "@/lib/playback/resolver";
import { getMovie } from "@/lib/tmdb/movies";
import { getRecommendations } from "@/lib/tmdb/recommendations";
import { getSimilarMovies } from "@/lib/tmdb/similar";
import { getBackdropUrl } from "@/lib/tmdb/images";
import { moviePath, watchPath } from "@/lib/slug";
import { parseMovieId } from "@/lib/validation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const movie = await getMovie(parseMovieId((await params).id));
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

  let movie;
  try {
    movie = await getMovie(tmdbId);
  } catch {
    return <PageError />;
  }
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

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${moviePath(movie.id, movie.title)}`;

  return (
    <>
      <MovieViewTracker movieId={movie.id} />
      <div className="page-container pt-4">
        <ShareActions title={movie.title} url={shareUrl} />
      </div>
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
