"use client";

import { BrandMark } from "@/components/brand/BrandMark";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { InstallButton } from "@/components/pwa/InstallButton";
import { DEVELOPER_CREDIT, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  DESKTOP_MORE_NAV,
  PRIMARY_NAV,
  isNavActive,
} from "@/components/layout/nav-config";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserLibrary } from "@/components/providers/UserLibraryProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const headingId = `footer-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="footer-column" role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className="footer-column__title">{title}</h3>
      <nav className="footer-column__nav" aria-label={title}>
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="footer-column__link">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
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

  const [modKey, setModKey] = useState("Ctrl");

  useEffect(() => {
    setModKey(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);

  return (
    <div className={["app-shell", settings.tvMode ? "tv-mode" : ""].filter(Boolean).join(" ")}>
      <header className={`site-header glass-surface glass-surface--nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="site-header__inner">
          <Logo />
          <nav className="site-nav" aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav__link ${isNavActive(pathname, item.href) ? "is-active" : ""}`}
                aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
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
                aria-haspopup="menu"
              >
                More
              </button>
              {moreOpen ? (
                <>
                  <button type="button" className="theme-toggle-backdrop" onClick={() => setMoreOpen(false)} aria-hidden />
                  <div className="site-nav__dropdown" role="menu">
                    {DESKTOP_MORE_NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="site-nav__dropdown-link"
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </nav>
          <div className="site-header__actions">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="search-trigger-mobile"
              aria-label="Search"
            >
              <span aria-hidden>⌕</span>
            </button>
            <button type="button" onClick={() => setSearchOpen(true)} className="search-trigger" aria-label="Search">
              <span className="search-trigger__label">Search</span>
              <kbd suppressHydrationWarning>{modKey} K</kbd>
            </button>
            <InstallButton variant="header" />
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
            <BrandMark size={88} className="site-footer__logo" />
            <p className="site-footer__brand">{DEVELOPER_CREDIT}</p>
            <p className="site-footer__tagline">
              {SITE_TAGLINE} Metadata from TMDB and IMDb — {SITE_NAME} does not host films.
            </p>
            <FeedbackDialog />
          </div>
          <FooterColumn title="Explore" links={FOOTER_EXPLORE} />
          <FooterColumn title="Social" links={FOOTER_SOCIAL} />
          <FooterColumn title="Platform" links={FOOTER_PLATFORM} />
        </div>
        <p className="site-footer__legal">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Watch availability via JustWatch partnership data.
        </p>
      </footer>

      <MobileNav onSearch={() => setSearchOpen(true)} searchOpen={searchOpen} />
      <ScrollToTop />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
