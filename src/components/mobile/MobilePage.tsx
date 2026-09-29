import type { ReactNode } from "react";

/** Standard mobile page scaffold — desktop renders children unchanged. */
export function MobilePage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["mobile-page", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function MobileSection({
  title,
  href,
  linkLabel = "See all",
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="mobile-section">
      <header className="mobile-section__head">
        <h2 className="mobile-section__title">{title}</h2>
        {href ? (
          <a href={href} className="mobile-section__link">
            {linkLabel}
          </a>
        ) : null}
      </header>
      {children}
    </section>
  );
}
