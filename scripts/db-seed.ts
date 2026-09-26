import { seedAiRegistry } from "../src/lib/ai/repository";
import { getIntelligenceFeatures } from "../src/lib/ai/features/registry";
import { getDatabase } from "../src/lib/db/client";

async function main() {
  await seedAiRegistry();
  const db = await getDatabase();
  const now = new Date().toISOString();
  for (const feature of getIntelligenceFeatures()) {
    await db.run(
      `INSERT INTO ai_feature_registry (feature_id, slug, status, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(feature_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
      [feature.id, feature.slug, feature.status, now],
    );
  }
  console.log(`Seeded AI registry and ${getIntelligenceFeatures().length} intelligence features.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
