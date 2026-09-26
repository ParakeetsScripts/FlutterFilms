import { FEATURED_GENRES } from "@/lib/regions";
import { genrePath } from "@/lib/slug";
import Link from "next/link";

export default function PeoplePage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">People</p>
        <h1 className="page-header__title">Filmmakers & cast</h1>
        <p className="page-header__subtitle">Search people with ⌘K, or browse by genre to find related talent.</p>
      </header>
      <div className="mt-8 flex flex-wrap gap-2">
        {FEATURED_GENRES.map((g) => (
          <Link key={g.id} href={genrePath(g.id, g.name)} className="filter-chip">{g.name}</Link>
        ))}
      </div>
    </div>
  );
}
