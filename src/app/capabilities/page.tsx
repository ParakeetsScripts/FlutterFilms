import { PlatformCapabilities } from "@/components/intelligence/PlatformCapabilities";
import { countByStatus } from "@/lib/ai/features/validate";
import { FEATURE_CATALOG } from "@/lib/ai/features/catalog";

export default function CapabilitiesPage() {
  const stats = countByStatus();
  return (
    <div className="page-container page-section">
      <PlatformCapabilities
        stats={{ live: stats.live, beta: stats.beta, planned: stats.planned }}
        featureCount={FEATURE_CATALOG.length}
      />
    </div>
  );
}
