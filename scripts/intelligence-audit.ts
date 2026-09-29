import { countByStatus, getValidatedFeatures } from "../src/lib/ai/features/validate";
import { CONTRACT_BY_SLUG } from "../src/lib/ai/features/feature-acceptance-contracts";
import { FEATURE_CATALOG } from "../src/lib/ai/features/catalog";

const counts = countByStatus();
const features = getValidatedFeatures();
const missingContracts = features.filter((feature) => !CONTRACT_BY_SLUG.has(feature.slug));
const missingService = features.filter((feature) => !feature.hasService);

console.log(`Capabilities: ${FEATURE_CATALOG.length}`);
console.log(`Live: ${counts.live}`);
console.log(`Beta: ${counts.beta}`);
console.log(`Planned: ${counts.planned}`);
console.log(`Schemas/contracts: ${CONTRACT_BY_SLUG.size}/${FEATURE_CATALOG.length}`);
console.log(`Missing contracts: ${missingContracts.length}`);
console.log(`Missing services: ${missingService.length}`);

if (FEATURE_CATALOG.length !== 200 || counts.live !== 200 || counts.beta !== 0 || counts.planned !== 0) {
  process.exitCode = 1;
}
