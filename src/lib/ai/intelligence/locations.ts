import "server-only";

import { getMovie } from "@/lib/tmdb/movies";
import { discoverMovies } from "@/lib/tmdb/discover";
import { trustBadge } from "../trust";

export type VerifiedLocation = {
  country: string;
  source: "production_country" | "origin_country";
  confidence: "verified";
};

export async function getMovieLocations(movieId: number) {
  const movie = await getMovie(movieId);
  if (!movie) return null;

  const locations: VerifiedLocation[] = [];
  for (const country of movie.productionCountries ?? []) {
    locations.push({ country: country.name, source: "production_country", confidence: "verified" });
  }

  return {
    movieId,
    title: movie.title,
    locations,
    hasCoordinates: false,
    labels: [trustBadge("verified"), trustBadge("metadata")],
    disclaimer: locations.length
      ? "Production countries from TMDB — not specific filming addresses."
      : "Not enough verified location data for this title.",
  };
}

export async function findMoviesByCountry(countryCode: string) {
  const discovered = await discoverMovies({ sort: "popularity", region: countryCode.toUpperCase() });
  return {
    country: countryCode,
    results: discovered.results.slice(0, 20),
    labels: [trustBadge("metadata")],
    disclaimer: "Results from regional discover query — verify production country on each title.",
  };
}
