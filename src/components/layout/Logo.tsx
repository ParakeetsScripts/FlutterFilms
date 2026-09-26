import { SITE_NAME } from "@/lib/brand";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="brand-logo" aria-label={`${SITE_NAME} home`}>
      <span className="brand-logo__primary">{SITE_NAME}</span>
    </Link>
  );
}
