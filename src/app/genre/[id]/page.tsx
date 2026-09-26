import { MovieRow } from "@/components/movie/MovieRow";
import { PageError } from "@/components/ui/States";
import { discoverMovies } from "@/lib/tmdb/discover";
import { getGenreList } from "@/lib/tmdb/configuration";
import { parseMovieId } from "@/lib/validation";

export default async function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseMovieId((await params).id);
    const [genres, popular, top, recent] = await Promise.all([
      getGenreList(),
      discoverMovies({ genre: id, sort: "popularity" }),
      discoverMovies({ genre: id, sort: "rating" }),
      discoverMovies({ genre: id, sort: "release_date" }),
    ]);
    const genre = genres.genres.find((item) => item.id === id);
    return (
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">Genre</p>
          <h1 className="mt-2 font-serif text-6xl">{genre?.name ?? "Genre"}</h1>
        </header>
        <MovieRow title="Popular" movies={popular.results} />
        <MovieRow title="Top rated" movies={top.results} />
        <MovieRow title="Recent" movies={recent.results} />
        <MovieRow title="Hidden selections" movies={top.results.slice().reverse()} />
      </div>
    );
  } catch {
    return <PageError />;
  }
}
