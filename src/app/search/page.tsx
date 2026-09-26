import { MovieCard } from "@/components/movie/MovieCard";
import { PageError } from "@/components/ui/States";
import { searchMovies } from "@/lib/tmdb/search";
import { parsePage, parseQuery } from "@/lib/validation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-serif text-5xl">Search</h1>
        <p className="mt-3 text-[var(--muted)]">Press / to search from anywhere.</p>
      </div>
    );
  }

  try {
    const results = await searchMovies(parseQuery(q), parsePage(typeof params.page === "string" ? params.page : undefined));
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-serif text-4xl">Results for “{q}”</h1>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
          {results.results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
        {results.results.length === 0 && <p className="mt-8 text-[var(--muted)]">No movies matched that search.</p>}
      </div>
    );
  } catch {
    return <PageError />;
  }
}
