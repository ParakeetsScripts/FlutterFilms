import { handleApi } from "@/lib/api";
import { verifyAiAdmin } from "@/lib/ai/admin-auth";
import { auditEnvironment } from "@/lib/release/env-audit";
import { getReleaseChecks } from "@/lib/release/status";

export async function GET(request: Request) {
  const denied = verifyAiAdmin(request);
  if (denied) return denied;

  return handleApi(async () => {
    const [checks, environment] = await Promise.all([getReleaseChecks(), auditEnvironment()]);
    const summary = {
      ready: checks.filter((c) => c.status === "READY").length,
      warning: checks.filter((c) => c.status === "WARNING").length,
      blocked: checks.filter((c) => c.status === "BLOCKED").length,
      error: checks.filter((c) => c.status === "ERROR").length,
    };
    const envSummary = {
      ready: environment.filter((e) => e.status === "READY").length,
      missing: environment.filter((e) => e.status === "MISSING").length,
      invalid: environment.filter((e) => e.status === "INVALID").length,
      optional: environment.filter((e) => e.status === "OPTIONAL").length,
    };
    return { checks, summary, environment, envSummary };
  });
}
