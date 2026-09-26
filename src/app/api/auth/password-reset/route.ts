import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { findUserByEmail, updatePassword } from "@/lib/auth/repository";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { createAuthToken, consumeAuthToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  rateLimit(`auth-reset:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const body = (await request.json()) as { email?: string; token?: string; password?: string };

    if (body.token && body.password) {
      validatePassword(body.password);
      const userId = await consumeAuthToken(body.token, "password_reset");
      if (!userId) throw new Error("Invalid or expired reset token.");
      await updatePassword(userId, await hashPassword(body.password));
      return { ok: true, reset: true };
    }

    if (!body.email) throw new Error("Email required.");
    const user = await findUserByEmail(body.email);
    if (user) {
      const token = await createAuthToken(user.id, "password_reset", 2);
      if (process.env.NODE_ENV !== "production") {
        console.info(`[dev] Password reset link: /account/reset?token=${token}`);
      }
    }
    return { ok: true, sent: true };
  });
}
