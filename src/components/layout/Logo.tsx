import { SITE_BYLINE, SITE_NAME } from "@/lib/brand";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="brand-logo" aria-label={`${SITE_NAME} ${SITE_BYLINE} home`}>
      <span className="brand-logo__primary">{SITE_NAME}</span>
      <span className="brand-logo__credit">{SITE_BYLINE}</span>
    </Link>
  );
}
