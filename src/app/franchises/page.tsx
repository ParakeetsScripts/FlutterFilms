import Link from "next/link";

export default function FranchisesPage() {
  return (
    <div className="page-container page-section">
      <header className="page-header">
        <p className="eyebrow">Franchises</p>
        <h1 className="page-header__title">Universes & collections</h1>
        <p className="page-header__subtitle">TMDB collections with chronological ordering. Open any collection from a movie detail page.</p>
      </header>
      <p className="mt-8 text-sm text-[var(--text-secondary)]">
        Example: visit a movie with a collection badge, or browse <Link href="/movies" className="text-[var(--accent-soft)]">Discover</Link>.
      </p>
    </div>
  );
}
