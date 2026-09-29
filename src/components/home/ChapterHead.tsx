import Link from "next/link";

export type ChapterBasis = { kind: string; text: string };

export function ChapterHead({
  index,
  marker,
  titleId,
  title,
  reason,
  href,
  hrefLabel = "Open",
  basis,
}: {
  index: number;
  marker: string;
  titleId: string;
  title: string;
  reason: string;
  href?: string;
  hrefLabel?: string;
  /** How the section's titles were chosen, labelled with the product's trust vocabulary. */
  basis?: ChapterBasis;
}) {
  return (
    <header className="chapter-head">
      <p className="chapter-marker">
        {String(index).padStart(2, "0")} — {marker}
      </p>
      <div className="chapter-head__row">
        <div className="chapter-head__copy">
          <h2 id={titleId} className="chapter-head__title">
            {title}
          </h2>
          <p className="chapter-head__reason">{reason}</p>
          {basis ? (
            <p className="chapter-head__basis">
              <span className="chapter-head__basis-kind">{basis.kind}</span>
              {basis.text}
            </p>
          ) : null}
        </div>
        {href ? (
          <Link href={href} className="btn btn-ghost text-sm shrink-0">
            {hrefLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
