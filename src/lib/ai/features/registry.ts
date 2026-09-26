import type { FeatureHealthStatus } from "./types";
import { getValidatedFeatures } from "./validate";
import { getFeatureDefinition } from "./definitions";
import {
  FEATURE_CATALOG,
  type FeatureCatalogEntry,
  type FeatureCategory,
} from "./catalog";

export type { FeatureCategory, FeatureCatalogEntry };
export { FEATURE_CATALOG };

export type IntelligenceFeature = {
  id: number;
  slug: string;
  title: string;
  category: FeatureCategory;
  status: FeatureHealthStatus;
  description: string;
  href?: string;
  api?: string;
  route: string;
  blockers: string[];
  hasService: boolean;
  hasApi: boolean;
  hasUi: boolean;
  hasTests: boolean;
};

export function getIntelligenceFeatures(): IntelligenceFeature[] {
  return getValidatedFeatures().map((f) => ({
    id: f.id,
    slug: f.slug,
    title: f.title,
    category: f.category,
    status: f.status,
    description: f.description,
    href: f.href,
    api: f.api ?? `/api/ai/features/${f.slug}/run`,
    route: f.route,
    blockers: f.blockers,
    hasService: f.hasService,
    hasApi: f.hasApi,
    hasUi: f.hasUi,
    hasTests: f.hasTests,
  }));
}

export function getIntelligenceFeature(slug: string): IntelligenceFeature | undefined {
  const def = getFeatureDefinition(slug);
  if (!def) return undefined;
  return getIntelligenceFeatures().find((f) => f.slug === slug);
}

export function getFeature(id: number) {
  return getIntelligenceFeatures().find((f) => f.id === id);
}

export function featuresByCategory(category: FeatureCategory) {
  return getIntelligenceFeatures().filter((f) => f.category === category);
}

/** @deprecated Use FEATURE_CATALOG for static metadata or getIntelligenceFeatures() for computed status */
export const INTELLIGENCE_FEATURES = FEATURE_CATALOG;
