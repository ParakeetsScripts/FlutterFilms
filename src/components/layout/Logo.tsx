import { BrandMark } from "@/components/brand/BrandMark";
import { SITE_BYLINE, SITE_NAME } from "@/lib/brand";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="brand-logo" aria-label={`${SITE_NAME} home`}>
      <BrandMark size={36} className="brand-logo__mark" priority />
      <span className="brand-logo__text">
        <span className="brand-logo__primary">{SITE_NAME}</span>
        <span className="brand-logo__credit">{SITE_BYLINE}</span>
      </span>
    </Link>
  );
}
