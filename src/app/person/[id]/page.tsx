import { PeopleIntelligencePanel } from "@/components/intelligence/PeopleIntelligencePanel";
import { MovieCard } from "@/components/movie/MovieCard";
import { PageError } from "@/components/ui/States";
import { tmdbFetch } from "@/lib/tmdb/client";
import { getProfileUrl } from "@/lib/tmdb/images";
import { normalizeMovieSummary, type TmdbMovieRaw } from "@/lib/tmdb/normalize";
import { parseMovieId } from "@/lib/validation";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseMovieId((await params).id);
    const person = await tmdbFetch<{
      name: string;
      biography: string;
      profile_path: string | null;
      movie_credits?: { cast?: TmdbMovieRaw[] };
    }>(`/person/${id}`, { append_to_response: "movie_credits" });
    const movies = (person.movie_credits?.cast ?? [])
      .map((item) => normalizeMovieSummary(item))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 18);
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex gap-8">
          {person.profile_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getProfileUrl(person.profile_path, "h632") ?? ""} alt={person.name} className="w-40" />
          )}
          <div>
            <h1 className="font-serif text-5xl">{person.name}</h1>
            <p className="mt-5 max-w-2xl leading-7 text-[#ddd7cc]">{person.biography || "No biography available."}</p>
          </div>
        </div>
        <PeopleIntelligencePanel personId={id} />
        <h2 className="mt-12 font-serif text-3xl">Known for</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    );
  } catch {
    return <PageError />;
  }
}
