import { FEATURED_GENRES } from "@/lib/regions";
import { getGenreList } from "@/lib/tmdb/configuration";
import { genrePath } from "@/lib/slug";
import Link from "next/link";

const GENRE_TONES: Record<number, string> = {
  28: "linear-gradient(135deg, #5c1d1d 0%, #12080a 100%)",
  35: "linear-gradient(135deg, #5a4a12 0%, #14100a 100%)",
  18: "linear-gradient(135deg, #1f3550 0%, #0a0d12 100%)",
  27: "linear-gradient(135deg, #2d1438 0%, #09070c 100%)",
  878: "linear-gradient(135deg, #12354a 0%, #080c12 100%)",
  16: "linear-gradient(135deg, #4a2f5c 0%, #100d14 100%)",
};

export default async function GenresPage() {
  const list = await getGenreList().catch(() => ({ genres: FEATURED_GENRES.map((genre) => ({ id: genre.id, name: genre.name })) }));
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Browse</p>
        <h1 className="page-header__title">Genres</h1>
        <p className="page-header__subtitle">Explore films by mood, style, and story.</p>
      </header>
      <div className="genre-grid mt-10">
        {list.genres.map((genre) => (
          <Link key={genre.id} href={genrePath(genre.id, genre.name)} className="genre-card">
            <div
              className="genre-card__fallback"
              style={{ background: GENRE_TONES[genre.id] ?? "linear-gradient(135deg, #1a2230 0%, #090b10 100%)" }}
            />
            <div className="genre-card__scrim" />
            <span className="genre-card__title">{genre.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
