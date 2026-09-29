import { countriesByContinent } from "./regions/countries";

export { COUNTRIES, COUNTRY_CONTINENTS, countriesByContinent, findCountry, searchCountries } from "./regions/countries";
export type { Country } from "./regions/countries";

/** @deprecated Use COUNTRIES — kept for settings/watch providers */
export const REGIONS = countriesByContinent("Popular").map((country) => ({
  code: country.code,
  name: country.name,
}));

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ta", name: "Tamil" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
] as const;

export const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950] as const;

export const MOVIE_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
] as const;

export const FEATURED_GENRES = MOVIE_GENRES.filter((genre) =>
  [28, 35, 18, 27, 878, 16].includes(genre.id),
);
