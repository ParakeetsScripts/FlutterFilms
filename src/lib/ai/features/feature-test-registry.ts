import { CONTRACT_BY_SLUG } from "./feature-acceptance-contracts";
import { FEATURE_CATALOG } from "./catalog";
import { implementationTierForSlug, tierAllowsLive } from "./feature-implementation-quality";

/**
 * Explicit acceptance-test registry — derived ONLY from registered contracts.
 * Do not infer from hasService.
 */
export const FEATURE_ACCEPTANCE_TEST_SLUGS: ReadonlySet<string> = new Set(CONTRACT_BY_SLUG.keys());

export function hasAcceptanceTest(slug: string): boolean {
  return FEATURE_ACCEPTANCE_TEST_SLUGS.has(slug);
}

export function acceptanceTestCount(): number {
  return FEATURE_ACCEPTANCE_TEST_SLUGS.size;
}

/** Slugs that may be LIVE after integrity + validator checks. */
export function liveEligibleSlugs(): string[] {
  return FEATURE_CATALOG.filter((f) => {
    const tier = implementationTierForSlug(f.slug);
    return tierAllowsLive(tier) && hasAcceptanceTest(f.slug);
  }).map((f) => f.slug);
}
