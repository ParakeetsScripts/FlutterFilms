import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { groupPick, tasteIntersection, tasteMatchPercent, type TasteProfile } from "@/lib/ai/intelligence/social";
import { moviePath } from "@/lib/slug";

export async function POST(request: Request) {
  rateLimit(`ai-social:${clientKey(request)}`, 20);
  return handleApi(async () => {
    const body = (await request.json()) as {
      action?: "group_pick" | "intersection" | "match";
      profiles?: TasteProfile[];
      history?: number[];
      profileA?: TasteProfile;
      profileB?: TasteProfile;
    };

    if (body.action === "intersection" && body.profiles?.length) {
      return tasteIntersection(body.profiles);
    }

    if (body.action === "match" && body.profileA && body.profileB) {
      return tasteMatchPercent(body.profileA, body.profileB);
    }

    const result = await groupPick(body.profiles ?? [], body.history ?? []);
    return {
      ...result,
      link: result.pick ? moviePath(result.pick.id, result.pick.title) : null,
    };
  });
}
