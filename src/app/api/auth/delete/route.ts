import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { requireSessionUser, destroySession } from "@/lib/auth/session";
import { deleteUserAccount } from "@/lib/auth/repository";

export async function POST(request: Request) {
  rateLimit(`auth-delete:${clientKey(request)}`, 5);
  return handleApi(async () => {
    const user = await requireSessionUser();
    await deleteUserAccount(user.id);
    await destroySession();
    return { ok: true };
  });
}
