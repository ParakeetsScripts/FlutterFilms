import { clientKey, handleApi, rateLimit } from "@/lib/api";
import { searchCatalog } from "@/lib/sync/catalog";
import { parsePage, parseQuery } from "@/lib/validation";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  rateLimit(`search:${clientKey(request)}`);
  return handleApi(() => searchCatalog(parseQuery(params.get("query")), parsePage(params.get("page"))));
}
