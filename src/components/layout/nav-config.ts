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

/** Bottom bar on mobile — About matches desktop primary nav placement. */
export const MOBILE_TAB_NAV: NavLink[] = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/about", label: "About", icon: "◉" },
  { href: "/discover", label: "Discover", icon: "◎" },
  { href: "/flutter-ai", label: "FlutterAI", icon: "✦" },
  { href: "/my-cinema", label: "Cinema", icon: "◈" },
];

export type MobileMenuSection = { title: string; links: NavLink[] };

/** Full mobile “More” sheet — parity with desktop header More + footer platform links. */
export const MOBILE_MENU_SECTIONS: MobileMenuSection[] = [
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
      { href: "/install", label: "Install app" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
