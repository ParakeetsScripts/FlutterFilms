"use client";

import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  MOBILE_MENU_SECTIONS,
  MOBILE_TAB_NAV,
  isNavActive,
} from "@/components/layout/nav-config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileNav({
  onSearch,
  searchOpen = false,
}: {
  onSearch: () => void;
  searchOpen?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MOBILE_MENU_SECTIONS.some((section) =>
    section.links.some((item) => isNavActive(pathname, item.href)),
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      <nav className="mobile-nav" aria-label="Primary">
        {MOBILE_TAB_NAV.map((item) => {
          if (item.kind === "search") {
            return (
              <button
                key="search"
                type="button"
                className={`mobile-nav__link ${searchOpen ? "is-active" : ""}`}
                onClick={onSearch}
                aria-label="Search"
                aria-pressed={searchOpen}
              >
                <span className="mobile-nav__icon" aria-hidden>{item.icon}</span>
                <span className="mobile-nav__label">{item.label}</span>
              </button>
            );
          }

          if (item.kind === "more") {
            return (
              <button
                key="more"
                type="button"
                className={`mobile-nav__link ${moreOpen || moreActive ? "is-active" : ""}`}
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                aria-haspopup="dialog"
                aria-controls="mobile-menu-sheet"
              >
                <span className="mobile-nav__icon" aria-hidden>{item.icon}</span>
                <span className="mobile-nav__label">{item.label}</span>
              </button>
            );
          }

          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav__link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-nav__icon" aria-hidden>{item.icon}</span>
              <span className="mobile-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {moreOpen ? (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="mobile-menu-sheet"
            className="mobile-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="More destinations"
          >
            <div className="mobile-menu-sheet__header">
              <p className="eyebrow">Menu</p>
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setMoreOpen(false)}>
                Close
              </button>
            </div>

            <div className="mobile-menu-sheet__actions">
              <button
                type="button"
                className="mobile-menu-sheet__link mobile-menu-sheet__link--action"
                onClick={() => {
                  setMoreOpen(false);
                  onSearch();
                }}
              >
                Search
              </button>
              <Link
                href={user ? "/account" : "/login"}
                className="mobile-menu-sheet__link mobile-menu-sheet__link--action"
                onClick={() => setMoreOpen(false)}
              >
                {user ? "Account" : "Sign in"}
              </Link>
            </div>

            <div className="mobile-menu-sheet__feedback">
              <FeedbackDialog />
            </div>

            {MOBILE_MENU_SECTIONS.map((section) => (
              <div key={section.title} className="mobile-menu-sheet__section">
                <p className="mobile-menu-sheet__section-title">{section.title}</p>
                <div className="mobile-menu-sheet__grid">
                  {section.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mobile-menu-sheet__link ${isNavActive(pathname, item.href) ? "is-active" : ""}`}
                      onClick={() => setMoreOpen(false)}
                      aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
