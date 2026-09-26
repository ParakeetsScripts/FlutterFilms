import type { TrustKind } from "@/lib/ai/trust";
import { TRUST_COPY } from "@/lib/ai/trust";

export function TrustBadge({ kind }: { kind: TrustKind }) {
  return <span className={`trust-badge trust-badge--${kind}`}>{TRUST_COPY[kind]}</span>;
}
