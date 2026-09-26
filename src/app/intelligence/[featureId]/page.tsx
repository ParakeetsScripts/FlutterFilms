import { FeatureDetail } from "@/components/intelligence/FeatureDetail";
import { FEATURE_CATALOG } from "@/lib/ai/features/catalog";
import { notFound } from "next/navigation";

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = await params;
  const bySlug = FEATURE_CATALOG.find((f) => f.slug === featureId);
  const byId = FEATURE_CATALOG.find((f) => String(f.id) === featureId);
  const feature = bySlug ?? byId;
  if (!feature) notFound();

  return (
    <div className="page-container page-section">
      <FeatureDetail slug={feature.slug} />
    </div>
  );
}
