import { handleApi, rateLimit, clientKey } from "@/lib/api";
import { findUserByEmail } from "@/lib/auth/repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  rateLimit(`auth-login:${clientKey(request)}`, 20);
  return handleApi(async () => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) throw new Error("Email and password required.");

    const user = await findUserByEmail(body.email);
    if (!user?.password_hash) throw new Error("Invalid email or password.");

    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) throw new Error("Invalid email or password.");

    await createSession(user.id, { ip: clientKey(request) });
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: Boolean(user.email_verified_at),
      },
    };
  });
}
