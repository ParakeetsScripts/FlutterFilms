import { FranchiseIntelligencePanel } from "@/components/intelligence/FranchiseIntelligencePanel";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { PageError } from "@/components/ui/States";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/images";
import { getMovieCollection } from "@/lib/tmdb/movies";
import { normalizeMovieSummary } from "@/lib/tmdb/normalize";
import { parseMovieId } from "@/lib/validation";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseMovieId((await params).id);
  let collection;
  try {
    collection = await getMovieCollection(id);
  } catch {
    return <PageError message="This collection could not be loaded." />;
  }
  if (!collection) notFound();

  const movies = collection.parts
    .map((part) => normalizeMovieSummary(part))
    .filter((movie): movie is NonNullable<typeof movie> => Boolean(movie))
    .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));

  const backdrop = getBackdropUrl(collection.backdrop_path, "w1280");
  const poster = getPosterUrl(collection.poster_path, "w500");

  return (
    <div>
      <section className="collection-hero">
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" className="collection-hero__backdrop" />
        ) : null}
        <div className="collection-hero__scrim" />
        <div className="collection-hero__content page-container">
          <p className="eyebrow">Collection</p>
          <div className="collection-hero__layout">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" className="collection-hero__poster" />
            ) : null}
            <div>
              <h1 className="collection-hero__title">{collection.name}</h1>
              {collection.overview ? <p className="collection-hero__overview">{collection.overview}</p> : null}
              <p className="mt-3 text-sm text-[var(--text-muted)]">{movies.length} films · chronological order</p>
            </div>
          </div>
        </div>
      </section>
      <div className="page-container page-section space-y-10">
        <FranchiseIntelligencePanel collectionId={id} />
        <MovieGrid movies={movies} />
      </div>
    </div>
  );
}
