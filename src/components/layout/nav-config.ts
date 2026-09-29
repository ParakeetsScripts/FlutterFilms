export type NavLink = { href: string; label: string; icon?: string };

/** Desktop header primary links — also used to derive mobile destinations. */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/discover", label: "Discover" },
  { href: "/flutter-ai", label: "FlutterAI" },
  { href: "/my-cinema", label: "My Cinema" },
  { href: "/watchlist", label: "Watchlist" },
];

export const DESKTOP_MORE_NAV: NavLink[] = [
  { href: "/watchlists", label: "Lists" },
  { href: "/community", label: "Community" },
  { href: "/settings", label: "Settings" },
];

export type MobileTabItem =
  | { kind: "link"; href: string; label: string; icon: string }
  | { kind: "search"; label: string; icon: string }
  | { kind: "more"; label: string; icon: string };

/** Bottom bar on mobile — Home · Discover · Search · My Cinema · More */
export const MOBILE_TAB_NAV: MobileTabItem[] = [
  { kind: "link", href: "/", label: "Home", icon: "⌂" },
  { kind: "link", href: "/movies", label: "Discover", icon: "◎" },
  { kind: "search", label: "Search", icon: "⌕" },
  { kind: "link", href: "/my-cinema", label: "My Cinema", icon: "◈" },
  { kind: "more", label: "More", icon: "⋯" },
];

export type MobileMenuSection = { title: string; links: NavLink[] };

/** Full mobile “More” sheet — parity with desktop header More + footer platform links. */
export const MOBILE_MENU_SECTIONS: MobileMenuSection[] = [
  {
    title: "FlutterFilms",
    links: [
      { href: "/about", label: "About" },
      { href: "/flutter-ai", label: "FlutterAI" },
      { href: "/install", label: "Install app" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Your cinema",
    links: [
      { href: "/watchlist", label: "Watchlist" },
      { href: "/favorites", label: "Favorites" },
      { href: "/history", label: "History" },
      { href: "/tonight", label: "Tonight" },
      { href: "/onboarding", label: "Onboarding" },
    ],
  },
  {
    title: "Social",
    links: [
      { href: "/watchlists", label: "Shared lists" },
      { href: "/community", label: "Community" },
      { href: "/rooms", label: "Rooms" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/movies", label: "Movies" },
      { href: "/people", label: "People" },
      { href: "/franchises", label: "Franchises" },
      { href: "/genres", label: "Genres" },
      { href: "/latest", label: "Latest" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/intelligence", label: "Intelligence" },
      { href: "/images", label: "Images" },
      { href: "/videos", label: "Videos" },
      { href: "/capabilities", label: "Platform" },
      { href: "/account/activity", label: "Activity" },
      { href: "/account/privacy", label: "Privacy" },
    ],
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/movies") {
    return pathname === "/movies" || pathname === "/discover" || pathname.startsWith("/movies/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
