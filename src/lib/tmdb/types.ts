export type Genre = {
  id: number;
  name: string;
};

export type NamedEntity = {
  id?: number;
  name: string;
  iso?: string | null;
};

export type CreditPerson = {
  id: number;
  name: string;
  character: string | null;
  job: string | null;
  department: string | null;
  profilePath: string | null;
  order: number | null;
};

export type Video = {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt: string | null;
};

export type Artwork = {
  filePath: string;
  width: number | null;
  height: number | null;
  language: string | null;
  voteAverage: number | null;
};

export type WatchProvider = {
  id: number;
  name: string;
  logoPath: string | null;
  type: "flatrate" | "rent" | "buy" | "ads" | "free";
};

export type WatchProviderGroup = {
  region: string;
  link: string | null;
  streaming: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
  ads: WatchProvider[];
  free: WatchProvider[];
};

export type CollectionSummary = {
  id: number;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
};

export type Keyword = {
  id: number;
  name: string;
};

export type ReleaseDateEntry = {
  region: string;
  regionName: string;
  certification: string | null;
  releaseDate: string | null;
  type: number;
  typeLabel: string;
};

export type MovieReleaseInfo = {
  certification: string | null;
  byRegion: ReleaseDateEntry[];
};

export type Movie = {
  id: number;
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  releaseDate: string | null;
  year: number | null;
  runtime: number | null;
  status: string | null;
  originalLanguage: string | null;
  genres: Genre[];
  posterPath: string | null;
  backdropPath: string | null;
  logoPaths: string[];
  voteAverage: number | null;
  voteCount: number | null;
  popularity: number | null;
  adult: boolean;
  productionCompanies: NamedEntity[];
  productionCountries: NamedEntity[];
  spokenLanguages: NamedEntity[];
  budget: number | null;
  revenue: number | null;
  homepage: string | null;
  imdbId: string | null;
  credits: {
    cast: CreditPerson[];
    crew: CreditPerson[];
  };
  videos: Video[];
  images: {
    posters: Artwork[];
    backdrops: Artwork[];
    logos: Artwork[];
  };
  watchProviders: WatchProviderGroup | null;
  collection: CollectionSummary | null;
  keywords: Keyword[];
  releases: MovieReleaseInfo;
  source: "tmdb";
  sourceVersion: string;
  retrievedAt: string;
  tmdbRating?: number | null;
  tmdbVoteCount?: number | null;
  imdbRating?: number | null;
  imdbVoteCount?: number | null;
  lastSyncedAt?: string | null;
  metadataUpdatedAt?: string | null;
  ratingsUpdatedAt?: string | null;
  metadataCompleteness?: number | null;
  runtimeConflict?: { tmdb: number | null; imdb: number | null; selected: number | null };
};

export type MovieSummary = Pick<
  Movie,
  | "id"
  | "tmdbId"
  | "title"
  | "originalTitle"
  | "overview"
  | "releaseDate"
  | "year"
  | "posterPath"
  | "backdropPath"
  | "voteAverage"
  | "voteCount"
  | "popularity"
  | "originalLanguage"
  | "genres"
  | "adult"
  | "source"
  | "sourceVersion"
  | "retrievedAt"
>;

export type PagedResult<T> = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
};

export type TmdbError = {
  status: "unavailable";
  message: string;
};

export type DiscoverQuery = {
  page?: number;
  genre?: number;
  year?: number;
  yearGte?: number;
  yearLte?: number;
  releaseDateGte?: string;
  releaseDateLte?: string;
  runtimeGte?: number;
  runtimeLte?: number;
  ratingGte?: number;
  ratingLte?: number;
  voteCountGte?: number;
  voteCountLte?: number;
  /** TMDB `language` — localized titles/overviews */
  uiLanguage?: string;
  /** TMDB `with_original_language` — content filter */
  originalLanguage?: string;
  /** @deprecated use originalLanguage */
  language?: string;
  region?: string;
  /** TMDB `with_origin_country` — production country filter */
  originCountry?: string;
  sort?: "popularity" | "rating" | "release_date" | "title";
  sortDirection?: "asc" | "desc";
};
