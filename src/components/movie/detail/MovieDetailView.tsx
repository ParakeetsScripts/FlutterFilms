import { HistoryRecorder } from "@/components/movie/HistoryRecorder";
import { MovieRow } from "@/components/movie/MovieRow";
import { OverviewText } from "@/components/movie/OverviewText";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { CastBlock } from "@/components/movie/detail/CastBlock";
import { CrewBlock } from "@/components/movie/detail/CrewBlock";
import { GalleryBlock } from "@/components/movie/detail/GalleryBlock";
import { MovieIntelligencePanel } from "@/components/intelligence/MovieIntelligencePanel";
import { MovieDetailActions } from "@/components/movie/detail/MovieDetailActions";
import { StickyMovieBar } from "@/components/movie/detail/StickyMovieBar";
import { WatchProvidersBlock } from "@/components/movie/detail/WatchProvidersBlock";
import { SITE_NAME } from "@/lib/brand";
import {
  dedupeMovies,
  formatCurrency,
  formatReleaseMonth,
  heroSynopsis,
  languageLabel,
} from "@/lib/movie/detail-helpers";
import { formatRelativeTime } from "@/lib/sync/freshness";
import { getPrimaryTrailer } from "@/lib/tmdb/videos";
import { MovieHeroBackground } from "@/components/movie/detail/MovieHeroBackground";
import { MovieTrailerSection } from "@/components/movie/detail/MovieTrailerSection";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/images";
import type { Movie, MovieSummary } from "@/lib/tmdb/types";
import { formatRuntime, moviePath } from "@/lib/slug";

const HERO_ID = "movie-detail-hero";

export function MovieDetailView({
  movie,
  recommendations,
  similar,
  playbackLabel,
  playbackHref,
}: {
  movie: Movie;
  recommendations: MovieSummary[];
  similar: MovieSummary[];
  playbackLabel: string;
  playbackHref?: string;
}) {
  const backdrop = getBackdropUrl(movie.backdropPath, "w1280");
  const poster = getPosterUrl(movie.posterPath, "w500");
  const trailer = getPrimaryTrailer(movie.videos);
  const trailerHref = trailer ? `#trailer` : undefined;
  const certification = movie.releases?.certification;
  const recs = dedupeMovies(recommendations, 8);
  const sim = dedupeMovies(similar, 8);

  const quickFacts = [
    formatReleaseMonth(movie.releaseDate),
    formatRuntime(movie.runtime),
    certification,
    languageLabel(movie, movie.originalLanguage),
    movie.productionCountries[0]?.name,
  ].filter(Boolean);

  const atAGlance = [
    movie.status && movie.status !== "Released" ? { label: "Status", value: movie.status } : null,
    movie.releaseDate ? { label: "Release", value: movie.releaseDate } : null,
    movie.runtime ? { label: "Runtime", value: formatRuntime(movie.runtime) } : null,
    certification ? { label: "Certification", value: certification } : null,
    movie.originalLanguage ? { label: "Language", value: languageLabel(movie, movie.originalLanguage) } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row?.value));

  const detailRows = [
    movie.originalTitle && movie.originalTitle !== movie.title
      ? { label: "Original title", value: movie.originalTitle }
      : null,
    movie.status ? { label: "Status", value: movie.status } : null,
    movie.releaseDate ? { label: "Release date", value: movie.releaseDate } : null,
    formatCurrency(movie.budget) ? { label: "Budget", value: formatCurrency(movie.budget)! } : null,
    formatCurrency(movie.revenue) ? { label: "Box office", value: formatCurrency(movie.revenue)! } : null,
    movie.homepage ? { label: "Homepage", value: movie.homepage, href: movie.homepage } : null,
    movie.productionCompanies.length
      ? { label: "Production", value: movie.productionCompanies.map((c) => c.name).slice(0, 5).join(", ") }
      : null,
    movie.productionCountries.length
      ? { label: "Countries", value: movie.productionCountries.map((c) => c.name).join(", ") }
      : null,
    movie.spokenLanguages.length
      ? { label: "Spoken languages", value: movie.spokenLanguages.map((l) => l.name).join(", ") }
      : null,
  ].filter((row): row is { label: string; value: string; href?: string } => Boolean(row));

  const releasePreview = (movie.releases?.byRegion ?? [])
    .filter((e) => ["US", "GB", "IN", "CA", "AU"].includes(e.region))
    .slice(0, 8);

  const keywords = movie.keywords ?? [];

  return (
    <article>
      <HistoryRecorder movieId={movie.id} />
      <StickyMovieBar movie={movie} playbackLabel={playbackLabel} playbackHref={playbackHref} heroId={HERO_ID} />

      <header id={HERO_ID} className="detail-hero-v2" data-testid="movie-hero">
        <MovieHeroBackground
          movieId={movie.id}
          backdrop={backdrop}
          initialVideos={movie.videos ?? []}
        />
        <div className="detail-hero-v2__scrim" />
        <div className="detail-hero-v2__content page-container">
          <div className="detail-hero-v2__layout">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={`${movie.title} poster`} className="detail-hero-v2__poster" />
            ) : (
              <div className="detail-hero-v2__poster poster-fallback flex items-end p-4 text-sm">{movie.title}</div>
            )}
            <div className="detail-hero-v2__glass">
              {movie.tagline && <p className="detail-hero-v2__tagline">{movie.tagline}</p>}
              <h1 className="detail-hero-v2__title">{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="detail-hero-v2__original">{movie.originalTitle}</p>
              )}
              <div className="detail-hero-v2__meta">
                <p className="detail-hero-v2__meta-primary">
                  {[movie.year, formatRuntime(movie.runtime), certification].filter(Boolean).join(" · ")}
                </p>
                {movie.genres.length > 0 && (
                  <p className="detail-hero-v2__meta-genres">
                    {movie.genres.map((genre) => genre.name).join(" · ")}
                  </p>
                )}
              </div>
              <div className="detail-hero-v2__ratings">
                <RatingBadge
                  source="TMDB"
                  rating={movie.tmdbRating ?? movie.voteAverage}
                  voteCount={movie.tmdbVoteCount ?? movie.voteCount}
                  variant="stacked"
                />
                <RatingBadge
                  source="IMDb"
                  rating={movie.imdbRating}
                  voteCount={movie.imdbVoteCount}
                  variant="stacked"
                />
              </div>
              {movie.metadataUpdatedAt && (
                <p className="detail-hero-v2__sync">
                  <span className="detail-hero-v2__sync-dot" aria-hidden="true" />
                  Synced {formatRelativeTime(movie.metadataUpdatedAt)}
                </p>
              )}
              {heroSynopsis(movie.overview, 200) && (
                <p className="detail-hero-v2__synopsis">{heroSynopsis(movie.overview, 200)}</p>
              )}
              <MovieDetailActions
                movieId={movie.id}
                playbackLabel={playbackLabel}
                playbackHref={playbackHref}
                trailerHref={trailerHref}
              />
            </div>
          </div>
        </div>
      </header>

      {quickFacts.length > 0 && (
        <div className="quick-facts page-container">
          {quickFacts.map((fact) => (
            <span key={fact} className="quick-facts__item">{fact}</span>
          ))}
        </div>
      )}

      <div className="page-container detail-body">
        {movie.overview && (
          <section className="detail-section">
            <h2 className="section-title">Overview</h2>
            <OverviewText text={movie.overview} />
          </section>
        )}

        {atAGlance.length > 0 && (
          <section className="detail-section">
            <h2 className="section-title">At a glance</h2>
            <dl className="at-a-glance">
              {atAGlance.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <WatchProvidersBlock movieId={movie.id} initial={movie.watchProviders} />

        <CastBlock cast={movie.credits.cast} />
        <CrewBlock crew={movie.credits.crew} />

        <MovieTrailerSection
          movieId={movie.id}
          movieTitle={movie.title}
          posterPath={movie.posterPath}
          initialVideos={movie.videos ?? []}
        />

        {detailRows.length > 0 && (
          <section className="detail-section">
            <details className="details-panel">
              <summary>More details</summary>
              <dl className="details-panel__grid">
                {detailRows.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>
                      {row.href ? (
                        <a href={row.href} className="detail-link" target="_blank" rel="noopener noreferrer">{row.value}</a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          </section>
        )}

        {releasePreview.length > 0 && (
          <section className="detail-section">
            <h2 className="section-title">Release information</h2>
            <div className="release-list">
              {releasePreview.map((entry, i) => (
                <div key={`${entry.region}-${entry.type}-${i}`} className="release-list__row">
                  <span className="release-list__region">{entry.regionName}</span>
                  <span className="release-list__type">{entry.typeLabel}</span>
                  {entry.certification ? <span className="release-list__cert">{entry.certification}</span> : null}
                  {entry.releaseDate ? <span className="release-list__date">{entry.releaseDate.slice(0, 10)}</span> : null}
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.collection && (
          <section className="detail-section collection-banner">
            <p className="eyebrow">Part of</p>
            <h2 className="section-title">{movie.collection.name}</h2>
            <a
              href={`https://www.themoviedb.org/collection/${movie.collection.id}`}
              className="btn btn-secondary mt-3"
              target="_blank"
              rel="noopener noreferrer"
            >
              View collection
            </a>
          </section>
        )}

        {keywords.length > 0 && (
          <section className="detail-section">
            <h2 className="section-title">Themes & keywords</h2>
            <div className="keyword-list">
              {keywords.slice(0, 12).map((kw) => (
                <span key={kw.id} className="keyword-chip">{kw.name}</span>
              ))}
            </div>
          </section>
        )}

        <GalleryBlock title={movie.title} backdrops={movie.images.backdrops} />

        <MovieIntelligencePanel movieId={movie.id} />

        {recs.length > 0 && (
          <MovieRow title="You might also like" movies={recs} href="/movies" railId="movie-recs" />
        )}
        {sim.length > 0 && (
          <MovieRow title="Similar movies" movies={sim} railId="movie-similar" />
        )}

        <section className="detail-section">
          <details className="sources-panel">
            <summary>Data sources</summary>
            <div className="sources-panel__body space-y-4">
              <p><strong>TMDB</strong> — metadata, images, videos, recommendations</p>
              <p><strong>IMDb</strong> — ratings via official datasets where linked</p>
              <p><strong>JustWatch</strong> — regional availability via TMDB</p>
              <p className="text-[var(--text-muted)]">
                <a href={`https://www.themoviedb.org/movie/${movie.id}`} className="detail-link">TMDB</a>
                {movie.imdbId ? (
                  <>
                    {" · "}
                    <a href={`https://www.imdb.com/title/${movie.imdbId}/`} className="detail-link">IMDb</a>
                  </>
                ) : null}
              </p>
              {movie.runtimeConflict && (
                <p className="text-sm text-[var(--text-muted)]">
                  Some sources differ on runtime — TMDB {movie.runtimeConflict.tmdb ?? "—"} min, IMDb{" "}
                  {movie.runtimeConflict.imdb ?? "—"} min. Displaying {movie.runtimeConflict.selected ?? "—"} min per configured priority.
                </p>
              )}
            </div>
          </details>
          <p className="detail-attribution mt-6">Metadata and imagery from TMDB. {SITE_NAME} does not host this film.</p>
        </section>
      </div>
    </article>
  );
}
