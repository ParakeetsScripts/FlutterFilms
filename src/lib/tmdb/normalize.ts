import { REGIONS } from "@/lib/regions";
import type {
  Artwork,
  CollectionSummary,
  CreditPerson,
  Genre,
  Keyword,
  Movie,
  MovieReleaseInfo,
  MovieSummary,
  NamedEntity,
  PagedResult,
  ReleaseDateEntry,
  Video,
  WatchProvider,
  WatchProviderGroup,
} from "./types";
import { TMDB_SOURCE_VERSION } from "./constants";
import { getGenreLookup } from "./genres";

type TmdbGenre = { id?: number; name?: string };
type TmdbCompany = { id?: number; name?: string };
type TmdbCountry = { iso_3166_1?: string; name?: string };
type TmdbLanguage = { iso_639_1?: string; english_name?: string; name?: string };
type TmdbPerson = {
  id?: number;
  name?: string;
  character?: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
  order?: number;
};
type TmdbVideo = {
  id?: string;
  name?: string;
  key?: string;
  site?: string;
  type?: string;
  official?: boolean;
  published_at?: string;
};
type TmdbImage = {
  file_path?: string;
  width?: number;
  height?: number;
  iso_639_1?: string | null;
  vote_average?: number;
};
type TmdbProvider = {
  provider_id?: number;
  provider_name?: string;
  logo_path?: string | null;
};

export type TmdbMovieRaw = {
  id?: number;
  title?: string;
  original_title?: string;
  overview?: string;
  tagline?: string;
  release_date?: string;
  runtime?: number;
  status?: string;
  original_language?: string;
  genres?: TmdbGenre[];
  genre_ids?: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  adult?: boolean;
  production_companies?: TmdbCompany[];
  production_countries?: TmdbCountry[];
  spoken_languages?: TmdbLanguage[];
  budget?: number;
  revenue?: number;
  homepage?: string;
  imdb_id?: string | null;
  belongs_to_collection?: {
    id?: number;
    name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
  } | null;
  credits?: { cast?: TmdbPerson[]; crew?: TmdbPerson[] };
  videos?: { results?: TmdbVideo[] };
  images?: { posters?: TmdbImage[]; backdrops?: TmdbImage[]; logos?: TmdbImage[] };
  "watch/providers"?: {
    results?: Record<
      string,
      {
        link?: string;
        flatrate?: TmdbProvider[];
        rent?: TmdbProvider[];
        buy?: TmdbProvider[];
        ads?: TmdbProvider[];
        free?: TmdbProvider[];
      }
    >;
  };
  keywords?: { keywords?: Array<{ id?: number; name?: string }> };
  release_dates?: {
    results?: Array<{
      iso_3166_1?: string;
      release_dates?: Array<{
        certification?: string;
        type?: number;
        release_date?: string;
      }>;
    }>;
  };
};

export type TmdbPagedRaw = {
  page?: number;
  total_pages?: number;
  total_results?: number;
  results?: TmdbMovieRaw[];
};

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function zeroToNull(value: number | null | undefined): number | null {
  if (value == null) return null;
  return value === 0 ? null : value;
}

function yearFromDate(date: string | null): number | null {
  if (!date || date.length < 4) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function mapPerson(person: TmdbPerson, fallbackJob: string | null = null): CreditPerson | null {
  if (!person.id || !person.name) return null;
  return {
    id: person.id,
    name: person.name,
    character: emptyToNull(person.character),
    job: emptyToNull(person.job) ?? fallbackJob,
    department: emptyToNull(person.department),
    profilePath: emptyToNull(person.profile_path),
    order: person.order ?? null,
  };
}

function mapArtwork(image: TmdbImage): Artwork | null {
  if (!image.file_path) return null;
  return {
    filePath: image.file_path,
    width: image.width ?? null,
    height: image.height ?? null,
    language: emptyToNull(image.iso_639_1),
    voteAverage: image.vote_average ?? null,
  };
}

function mapProviders(list: TmdbProvider[] | undefined, type: WatchProvider["type"]): WatchProvider[] {
  return (list ?? [])
    .map((provider) => {
      if (!provider.provider_id || !provider.provider_name) return null;
      return {
        id: provider.provider_id,
        name: provider.provider_name,
        logoPath: emptyToNull(provider.logo_path),
        type,
      } satisfies WatchProvider;
    })
    .filter((item): item is WatchProvider => item !== null);
}

const RELEASE_TYPE_LABELS: Record<number, string> = {
  1: "Premiere",
  2: "Limited theatrical",
  3: "Theatrical",
  4: "Digital",
  5: "Physical",
  6: "TV",
};

const REGION_NAMES = new Map(REGIONS.map((r) => [r.code, r.name]));

function regionName(code: string): string {
  return REGION_NAMES.get(code as (typeof REGIONS)[number]["code"]) ?? code;
}

function normalizeKeywords(raw: TmdbMovieRaw): Keyword[] {
  return (raw.keywords?.keywords ?? [])
    .filter((k): k is { id: number; name: string } => Boolean(k.id && k.name))
    .map((k) => ({ id: k.id, name: k.name }));
}

function normalizeReleases(raw: TmdbMovieRaw, preferredRegion = "US"): MovieReleaseInfo {
  const byRegion: ReleaseDateEntry[] = [];
  for (const block of raw.release_dates?.results ?? []) {
    const region = block.iso_3166_1;
    if (!region) continue;
    for (const entry of block.release_dates ?? []) {
      byRegion.push({
        region,
        regionName: regionName(region),
        certification: emptyToNull(entry.certification),
        releaseDate: emptyToNull(entry.release_date),
        type: entry.type ?? 0,
        typeLabel: RELEASE_TYPE_LABELS[entry.type ?? 0] ?? "Release",
      });
    }
  }
  const regional = byRegion.filter((e) => e.region === preferredRegion);
  const theatrical = regional.find((e) => e.type === 3) ?? regional.find((e) => e.certification);
  const certification = theatrical?.certification ?? null;
  return { certification, byRegion };
}

export function normalizeGenres(raw: TmdbGenre[] | undefined, genreLookup?: Map<number, string>): Genre[] {
  if (raw?.length) {
    return raw
      .filter((genre): genre is { id: number; name: string } => Boolean(genre.id && genre.name))
      .map((genre) => ({ id: genre.id, name: genre.name }));
  }
  return [];
}

export function normalizeMovieSummary(
  raw: TmdbMovieRaw,
  retrievedAt = new Date().toISOString(),
  genreLookup?: Map<number, string>,
): MovieSummary | null {
  if (!raw.id || !raw.title) return null;
  const releaseDate = emptyToNull(raw.release_date);
  const genres = raw.genres?.length
    ? normalizeGenres(raw.genres)
    : (raw.genre_ids ?? [])
        .map((id) => ({ id, name: genreLookup?.get(id) ?? "" }))
        .filter((genre) => genre.name);
  return {
    id: raw.id,
    tmdbId: raw.id,
    title: raw.title,
    originalTitle: emptyToNull(raw.original_title),
    overview: emptyToNull(raw.overview),
    releaseDate,
    year: yearFromDate(releaseDate),
    posterPath: emptyToNull(raw.poster_path),
    backdropPath: emptyToNull(raw.backdrop_path),
    voteAverage: zeroToNull(raw.vote_average),
    voteCount: zeroToNull(raw.vote_count),
    popularity: raw.popularity ?? null,
    originalLanguage: emptyToNull(raw.original_language),
    genres,
    adult: Boolean(raw.adult),
    source: "tmdb",
    sourceVersion: TMDB_SOURCE_VERSION,
    retrievedAt,
  };
}

export function normalizeMovie(
  raw: TmdbMovieRaw,
  options: { region?: string; retrievedAt?: string } = {},
): Movie | null {
  const summary = normalizeMovieSummary(raw, options.retrievedAt);
  if (!summary) return null;

  const collectionRaw = raw.belongs_to_collection;
  const collection: CollectionSummary | null =
    collectionRaw?.id && collectionRaw.name
      ? {
          id: collectionRaw.id,
          name: collectionRaw.name,
          posterPath: emptyToNull(collectionRaw.poster_path),
          backdropPath: emptyToNull(collectionRaw.backdrop_path),
        }
      : null;

  const region = options.region ?? "US";
  const providerRaw = raw["watch/providers"]?.results?.[region];
  const watchProviders: WatchProviderGroup | null = providerRaw
    ? {
        region,
        link: emptyToNull(providerRaw.link),
        streaming: mapProviders(providerRaw.flatrate, "flatrate"),
        rent: mapProviders(providerRaw.rent, "rent"),
        buy: mapProviders(providerRaw.buy, "buy"),
        ads: mapProviders(providerRaw.ads, "ads"),
        free: mapProviders(providerRaw.free, "free"),
      }
    : null;

  return {
    ...summary,
    tagline: emptyToNull(raw.tagline),
    runtime: zeroToNull(raw.runtime),
    status: emptyToNull(raw.status),
    logoPaths: (raw.images?.logos ?? []).map((logo) => logo.file_path).filter((path): path is string => Boolean(path)),
    productionCompanies: (raw.production_companies ?? [])
      .filter((company): company is TmdbCompany & { name: string } => Boolean(company.name))
      .map((company) => ({ id: company.id, name: company.name })),
    productionCountries: (raw.production_countries ?? [])
      .filter((country): country is TmdbCountry & { name: string } => Boolean(country.name))
      .map((country) => ({ name: country.name, iso: country.iso_3166_1 ?? null })),
    spokenLanguages: (raw.spoken_languages ?? [])
      .map((language) => ({
        name: language.english_name || language.name || "",
        iso: language.iso_639_1 ?? null,
      }))
      .filter((language) => language.name),
    budget: zeroToNull(raw.budget),
    revenue: zeroToNull(raw.revenue),
    homepage: emptyToNull(raw.homepage),
    imdbId: emptyToNull(raw.imdb_id),
    credits: {
      cast: (raw.credits?.cast ?? []).map((person) => mapPerson(person)).filter((item): item is CreditPerson => item !== null),
      crew: (raw.credits?.crew ?? []).map((person) => mapPerson(person)).filter((item): item is CreditPerson => item !== null),
    },
    videos: (raw.videos?.results ?? [])
      .map((video) => {
        if (!video.id || !video.key || !video.site) return null;
        return {
          id: video.id,
          name: video.name ?? "Video",
          key: video.key,
          site: video.site,
          type: video.type ?? "Video",
          official: Boolean(video.official),
          publishedAt: emptyToNull(video.published_at),
        } satisfies Video;
      })
      .filter((item): item is Video => item !== null),
    images: {
      posters: (raw.images?.posters ?? []).map(mapArtwork).filter((item): item is Artwork => item !== null),
      backdrops: (raw.images?.backdrops ?? []).map(mapArtwork).filter((item): item is Artwork => item !== null),
      logos: (raw.images?.logos ?? []).map(mapArtwork).filter((item): item is Artwork => item !== null),
    },
    watchProviders,
    collection,
    keywords: normalizeKeywords(raw),
    releases: normalizeReleases(raw, region),
  };
}

export function normalizePagedMovies(raw: TmdbPagedRaw, retrievedAt = new Date().toISOString()): PagedResult<MovieSummary> {
  const genreLookup = getGenreLookup();
  return {
    page: raw.page ?? 1,
    totalPages: raw.total_pages ?? 1,
    totalResults: raw.total_results ?? 0,
    results: (raw.results ?? [])
      .map((item) => normalizeMovieSummary(item, retrievedAt, genreLookup))
      .filter((item): item is MovieSummary => item !== null),
  };
}

export function namedList(items: NamedEntity[]): string[] {
  return items.map((item) => item.name);
}
