"use client";

import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { SITE_FULL_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PRIMARY = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/copilot", label: "AI" },
  { href: "/my-cinema", label: "My Cinema" },
  { href: "/watchlist", label: "Watchlist" },
];

const FOOTER_EXPLORE = [
  { href: "/movies", label: "Movies" },
  { href: "/people", label: "People" },
  { href: "/franchises", label: "Franchises" },
  { href: "/genres", label: "Genres" },
  { href: "/latest", label: "Latest" },
  { href: "/tonight", label: "Tonight" },
];

const FOOTER_SOCIAL = [
  { href: "/watchlists", label: "Shared lists" },
  { href: "/rooms", label: "Rooms" },
  { href: "/community", label: "Community" },
  { href: "/favorites", label: "Favorites" },
  { href: "/history", label: "History" },
];

const FOOTER_PLATFORM = [
  { href: "/intelligence", label: "Intelligence" },
  { href: "/images", label: "Images" },
  { href: "/videos", label: "Videos" },
  { href: "/open-models", label: "Open Models" },
  { href: "/demo", label: "Demo" },
  { href: "/install", label: "Install app" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/capabilities", label: "Platform" },
  { href: "/about", label: "About" },
  { href: "/account/activity", label: "Activity" },
  { href: "/account/privacy", label: "Privacy" },
  { href: "/settings", label: "Settings" },
];

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <details className="footer-column" open>
      <summary className="footer-column__title">{title}</summary>
      <nav className="footer-column__nav">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="footer-column__link">
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings } = useUserLibrary();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA";
      if ((event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key === "k")) && !inField) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMoreOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const modKey = typeof navigator !== "undefined" && /Mac/.test(navigator.platform) ? "⌘" : "Ctrl";

  return (
    <div className={settings.tvMode ? "tv-mode" : undefined}>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="site-header__inner">
          <Logo />
          <nav className="site-nav" aria-label="Primary">
            {PRIMARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav__link ${pathname === item.href ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="site-nav__more">
              <button
                type="button"
                className={`site-nav__link ${moreOpen ? "is-active" : ""}`}
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
              >
                More
              </button>
              {moreOpen ? (
                <>
                  <button type="button" className="theme-toggle-backdrop" onClick={() => setMoreOpen(false)} aria-hidden />
                  <div className="site-nav__dropdown">
                    <Link href="/watchlists" className="site-nav__dropdown-link" onClick={() => setMoreOpen(false)}>Lists</Link>
                    <Link href="/community" className="site-nav__dropdown-link" onClick={() => setMoreOpen(false)}>Community</Link>
                    <Link href="/settings" className="site-nav__dropdown-link" onClick={() => setMoreOpen(false)}>Settings</Link>
                  </div>
                </>
              ) : null}
            </div>
          </nav>
          <div className="site-header__actions">
            <button type="button" onClick={() => setSearchOpen(true)} className="search-trigger" aria-label="Search">
              <span className="search-trigger__label">Search</span>
              <kbd>{modKey} K</kbd>
            </button>
            <Link href={user ? "/account" : "/login"} className="btn btn-ghost btn-header-auth">
              {user ? "Account" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="site-footer__grid">
          <div className="site-footer__brand-col">
            <p className="site-footer__brand">{SITE_FULL_NAME}</p>
            <p className="site-footer__tagline">
              {SITE_TAGLINE} Metadata from TMDB and IMDb — {SITE_NAME} does not host films.
            </p>
            <FeedbackDialog />
            <p className="site-footer__credit">
              <span className="site-footer__credit-name">{SITE_FULL_NAME}</span>
            </p>
          </div>
          <FooterColumn title="Explore" links={FOOTER_EXPLORE} />
          <FooterColumn title="Social" links={FOOTER_SOCIAL} />
          <FooterColumn title="Platform" links={FOOTER_PLATFORM} />
        </div>
        <p className="site-footer__legal">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Watch availability via JustWatch partnership data.
        </p>
      </footer>

      <MobileNav onSearch={() => setSearchOpen(true)} />
      <ScrollToTop />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
