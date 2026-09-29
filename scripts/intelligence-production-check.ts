import { countByStatus, getValidatedFeatures } from "../src/lib/ai/features/validate";
import { CONTRACT_BY_SLUG } from "../src/lib/ai/features/feature-acceptance-contracts";
import { FEATURE_CATALOG } from "../src/lib/ai/features/catalog";

const counts = countByStatus();
const features = getValidatedFeatures();
const failures: string[] = [];

if (FEATURE_CATALOG.length !== 200) failures.push(`catalog is ${FEATURE_CATALOG.length}, expected 200`);
if (counts.live !== 200) failures.push(`live is ${counts.live}, expected 200`);
if (counts.beta !== 0) failures.push(`beta is ${counts.beta}, expected 0`);
if (counts.planned !== 0) failures.push(`planned is ${counts.planned}, expected 0`);
if (CONTRACT_BY_SLUG.size !== 200) failures.push(`contracts are ${CONTRACT_BY_SLUG.size}, expected 200`);

for (const feature of features) {
  if (!feature.hasService) failures.push(`${feature.slug}: missing service`);
  if (!feature.hasTests) failures.push(`${feature.slug}: missing acceptance contract`);
  if (!feature.route) failures.push(`${feature.slug}: missing route`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Intelligence production check passed: 200 LIVE / 0 BETA / 0 PLANNED");
