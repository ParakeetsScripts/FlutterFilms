"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/watchlist", label: "Watchlist" },
  { href: "/favorites", label: "Favorites" },
  { href: "/history", label: "History" },
];

export function LibraryNav() {
  const pathname = usePathname();
  return (
    <nav className="library-nav" aria-label="Personal library">
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`library-nav__link ${pathname === item.href ? "is-active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
