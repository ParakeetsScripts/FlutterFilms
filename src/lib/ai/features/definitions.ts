import { FEATURE_CATALOG } from "./catalog";
import { defaultCapabilities } from "./capabilities";
import type { FeatureDefinition } from "./types";

export function getFeatureDefinitions(): FeatureDefinition[] {
  return FEATURE_CATALOG.map((f) => ({
    id: f.id,
    slug: f.slug,
    title: f.title,
    category: f.category,
    description: f.description,
    href: f.href,
    api: f.api,
    ...defaultCapabilities(f.slug),
  }));
}

export function getFeatureDefinition(slug: string): FeatureDefinition | undefined {
  return getFeatureDefinitions().find((f) => f.slug === slug);
}

export function getFeatureDefinitionById(id: number): FeatureDefinition | undefined {
  return getFeatureDefinitions().find((f) => f.id === id);
}
