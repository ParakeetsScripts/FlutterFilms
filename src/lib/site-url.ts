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

/** Server-side origin for signed playback URLs and CDN links. */
export function getServerOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  if (process.env.URL) {
    try {
      return new URL(process.env.URL).origin;
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getCanonicalSiteLabel(): string {
  try {
    return new URL(getCanonicalSiteUrl()).host;
  } catch {
    return "this site";
  }
}
