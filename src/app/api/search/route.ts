import { clientKey, handleApi, rateLimit } from "@/lib/api";
import { FEATURED_GENRES } from "@/lib/regions";
import { genrePath, personPath } from "@/lib/slug";
import { searchCatalog } from "@/lib/sync/catalog";
import { searchPeople } from "@/lib/tmdb/search";
import { parsePage, parseQuery } from "@/lib/validation";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = parseQuery(params.get("query"));
  rateLimit(`search:${clientKey(request)}`);

  return handleApi(async () => {
    const page = parsePage(params.get("page"));
    const [movies, people] = await Promise.all([
      searchCatalog(query, page),
      searchPeople(query, page).catch(() => ({ results: [] })),
    ]);

    const q = query.toLowerCase();
    const genres = FEATURED_GENRES
      .filter((genre) => genre.name.toLowerCase().includes(q))
      .map((genre) => ({
        id: genre.id,
        name: genre.name,
        href: genrePath(genre.id, genre.name),
      }));

    const peopleResults = (people.results ?? []).slice(0, 6).map((person) => ({
      id: person.id,
      name: person.name,
      profilePath: person.profile_path,
      knownFor: person.known_for_department ?? null,
      href: personPath(person.id, person.name),
    }));

    return {
      query,
      movies: movies.results.slice(0, 10),
      people: peopleResults,
      genres,
    };
  });
}
