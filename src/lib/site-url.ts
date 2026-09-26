/** Canonical public site origin for install instructions and metadata. */
export function getCanonicalSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function getCanonicalSiteLabel(): string {
  try {
    return new URL(getCanonicalSiteUrl()).host;
  } catch {
    return "this site";
  }
}
