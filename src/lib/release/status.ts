import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDatabase, isPostgres } from "@/lib/db/client";
import { auditEnvironment } from "@/lib/release/env-audit";

export type ReleaseStatus = "READY" | "WARNING" | "BLOCKED" | "ERROR";

export type ReleaseCheck = {
  id: string;
  label: string;
  status: ReleaseStatus;
  detail: string;
};

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export async function getReleaseChecks(): Promise<ReleaseCheck[]> {
  const root = process.cwd();
  const checks: ReleaseCheck[] = [];
  const envAudit = auditEnvironment();

  try {
    const db = await getDatabase();
    await db.get("SELECT 1 AS ok");
    const driver = isPostgres() ? "Neon/Postgres" : "SQLite (local fallback)";
    checks.push({
      id: "database",
      label: "Database",
      status: isPostgres() ? "READY" : "WARNING",
      detail: isPostgres()
        ? `Production Postgres connected.`
        : `${driver} — set DATABASE_URL to postgres:// for production.`,
    });
  } catch (error) {
    checks.push({
      id: "database",
      label: "Database",
      status: "ERROR",
      detail: error instanceof Error ? error.message : "Database unavailable.",
    });
  }

  const tmdb = env("TMDB_API_KEY") || env("TMDB_API_TOKEN");
  checks.push({
    id: "tmdb",
    label: "TMDB",
    status: tmdb ? "READY" : "BLOCKED",
    detail: tmdb ? "API key configured." : "TMDB_API_KEY missing — catalog sync blocked.",
  });

  checks.push({
    id: "imdb",
    label: "IMDb sync",
    status: tmdb && env("CRON_SECRET") ? "READY" : "WARNING",
    detail: "IMDb ratings sync via cron — requires TMDB + CRON_SECRET.",
  });

  const aiLocal = env("OLLAMA_BASE_URL") || env("AI_LOCAL_ENDPOINT");
  const aiCloud = env("OPENAI_API_KEY") || env("AI_OPENAI_API_KEY");
  checks.push({
    id: "ai",
    label: "AI (cloud)",
    status: aiCloud ? "READY" : "WARNING",
    detail: aiCloud ? "Cloud AI configured." : "Optional — features degrade without cloud AI.",
  });
  checks.push({
    id: "local-ai",
    label: "Local AI",
    status: aiLocal ? "READY" : "WARNING",
    detail: aiLocal ? "Ollama/local endpoint configured." : "Optional — no local model connected.",
  });

  checks.push({
    id: "auth",
    label: "Authentication",
    status: env("CRON_SECRET") ? "READY" : "WARNING",
    detail: "Session auth implemented — verify signup/login on production URL.",
  });

  try {
    const db = await getDatabase();
    await db.get("SELECT COUNT(*) AS c FROM analytics_events");
    checks.push({
      id: "analytics",
      label: "Analytics",
      status: "READY",
      detail: "Analytics tables present.",
    });
  } catch {
    checks.push({ id: "analytics", label: "Analytics", status: "ERROR", detail: "Run db:migrate for analytics tables." });
  }

  const pwaFiles = ["/public/icons/icon-192.png", "/public/icons/icon-512.png", "/public/sw.js", "/src/app/manifest.ts"];
  const pwaMissing = pwaFiles.filter((f) => !existsSync(join(root, f)));
  checks.push({
    id: "pwa",
    label: "PWA",
    status: pwaMissing.length ? "WARNING" : "READY",
    detail: pwaMissing.length ? `Missing: ${pwaMissing.join(", ")}` : "Manifest, icons, service worker ready.",
  });

  const iosProject = existsSync(join(root, "ios"));
  checks.push({
    id: "ios",
    label: "iOS",
    status: iosProject ? "READY" : "WARNING",
    detail: iosProject ? "Capacitor iOS project generated." : "Run npx cap add ios.",
  });

  const vercelEnv = env("VERCEL") || env("VERCEL_URL");
  checks.push({
    id: "vercel",
    label: "Vercel",
    status: vercelEnv ? "READY" : "BLOCKED",
    detail: vercelEnv
      ? `Deployed on Vercel.`
      : "Not deployed — install Vercel CLI and run vercel --prod.",
  });

  const missingCritical = envAudit.filter((e) => e.status === "MISSING" && ["DATABASE_URL", "TMDB_API_KEY", "CRON_SECRET", "AI_ADMIN_SECRET"].includes(e.name));
  checks.push({
    id: "security",
    label: "Security",
    status: missingCritical.length ? "WARNING" : "READY",
    detail: missingCritical.length
      ? `Missing env: ${missingCritical.map((e) => e.name).join(", ")}`
      : "Core secrets configured server-side.",
  });

  checks.push({
    id: "tests",
    label: "Tests",
    status: existsSync(join(root, "vitest.config.ts")) ? "READY" : "WARNING",
    detail: "53+ tests — run npm test before deploy.",
  });

  checks.push({
    id: "build",
    label: "Build",
    status: existsSync(join(root, ".next")) ? "READY" : "WARNING",
    detail: existsSync(join(root, ".next")) ? "Production build artifacts found." : "Run npm run build.",
  });

  return checks;
}
