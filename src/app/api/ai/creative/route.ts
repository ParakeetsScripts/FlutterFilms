import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { buildCreativeAsset, type CreativeKind } from "@/lib/ai/intelligence/creative";

export async function POST(request: Request) {
  rateLimit(`ai-creative:${clientKey(request)}`, 15);
  return handleApi(async () => {
    const body = (await request.json()) as {
      kind?: CreativeKind;
      title?: string;
      subtitle?: string;
      items?: Array<{ label: string; value: string }>;
      movies?: Array<{ title: string; year?: number | null }>;
    };

    if (!body.title?.trim()) throw new Error("Title is required");

    return buildCreativeAsset(body.kind ?? "poster", {
      title: body.title.trim(),
      subtitle: body.subtitle,
      items: body.items,
      movies: body.movies,
    });
  });
}
