import { handleApi } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { getUserLibrary } from "@/lib/user/library-repository";
import { listTasteSignals } from "@/lib/user/taste-repository";
import { listAgentMemories } from "@/lib/user/repository";

export async function GET() {
  return handleApi(async () => {
    const user = await getSessionUser();
    if (!user) return { authenticated: false };

    const [library, tasteSignals, memories] = await Promise.all([
      getUserLibrary(user.id),
      listTasteSignals(user.id),
      listAgentMemories(user.id),
    ]);

    return { authenticated: true, user, library, tasteSignals, memories };
  });
}
