"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/discover", label: "Discover", icon: "◎" },
  { href: "/copilot", label: "AI", icon: "✦" },
  { href: "/my-cinema", label: "Cinema", icon: "◈" },
  { href: "/watchlist", label: "List", icon: "☰" },
];

const MORE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/login", label: "Sign in" },
  { href: "/watchlists", label: "Shared lists" },
  { href: "/community", label: "Community" },
  { href: "/rooms", label: "Rooms" },
  { href: "/tonight", label: "Tonight" },
  { href: "/settings", label: "Settings" },
  { href: "/install", label: "Install app" },
];

export function MobileNav({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="mobile-nav" aria-label="Mobile">
        {TABS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav__link ${pathname === item.href ? "is-active" : ""}`}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <span className="mobile-nav__icon" aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={`mobile-nav__link ${moreOpen ? "is-active" : ""}`}
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
        >
          <span className="mobile-nav__icon" aria-hidden>⋯</span>
          <span>More</span>
        </button>
      </nav>

      {moreOpen ? (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="mobile-menu-sheet" role="dialog" aria-label="More destinations">
            <div className="mobile-menu-sheet__header">
              <p className="eyebrow">Explore</p>
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setMoreOpen(false)}>
                Close
              </button>
            </div>
            <div className="mobile-menu-sheet__grid">
              {MORE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-menu-sheet__link"
                  onClick={() => setMoreOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button type="button" className="mobile-menu-sheet__link" onClick={() => { setMoreOpen(false); onSearch(); }}>
                Search
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
