import "server-only";

import {
  catalogCookieName,
  defaultCatalogPreferences,
  parseCatalogCookie,
  type CatalogPreferences,
} from "@/lib/catalog/preferences";
import { cookies } from "next/headers";

export async function getServerCatalogPreferences(): Promise<CatalogPreferences> {
  const store = await cookies();
  const parsed = parseCatalogCookie(store.get(catalogCookieName())?.value);
  return parsed ?? defaultCatalogPreferences;
}
