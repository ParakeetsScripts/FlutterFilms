import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { createEmailUser } from "@/lib/auth/repository";
import { validatePassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createAuthToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  rateLimit(`auth-signup:${clientKey(request)}`, 10);
  return handleApi(async () => {
    const body = (await request.json()) as { email?: string; password?: string; displayName?: string; username?: string };
    if (!body.email?.includes("@")) throw new Error("Valid email required.");
    if (!body.password) throw new Error("Password required.");
    validatePassword(body.password);

    const userId = await createEmailUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      username: body.username,
    });

    const verifyToken = await createAuthToken(userId, "email_verify", 48);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Email verification link: /api/auth/verify?token=${verifyToken}`);
    }

    await createSession(userId, { ip: clientKey(request) });
    return { ok: true, userId, emailVerificationSent: true };
  });
}
