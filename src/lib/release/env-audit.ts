import "server-only";

export type EnvStatus = "READY" | "MISSING" | "INVALID" | "OPTIONAL";

export type EnvCheck = {
  name: string;
  status: EnvStatus;
  detail: string;
  category: string;
};

function present(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export function auditEnvironment(): EnvCheck[] {
  const checks: EnvCheck[] = [];

  const databaseUrl = present("DATABASE_URL");
  checks.push({
    name: "DATABASE_URL",
    category: "Database",
    status: !databaseUrl ? "MISSING" : isPostgresUrl(databaseUrl) ? "READY" : "INVALID",
    detail: !databaseUrl
      ? "Required for production (Neon Postgres)."
      : isPostgresUrl(databaseUrl)
        ? "Postgres connection configured."
        : "Production should use postgres:// — SQLite is local fallback only.",
  });

  const directUrl = present("DIRECT_DATABASE_URL");
  checks.push({
    name: "DIRECT_DATABASE_URL",
    category: "Database",
    status: !directUrl ? "MISSING" : isPostgresUrl(directUrl) ? "READY" : "INVALID",
    detail: directUrl ? "Direct connection for migrations." : "Recommended for Neon migrations.",
  });

  const tmdb = present("TMDB_API_KEY") || present("TMDB_API_TOKEN");
  checks.push({
    name: "TMDB_API_KEY",
    category: "Catalog",
    status: tmdb ? "READY" : "MISSING",
    detail: tmdb ? "TMDB catalog enabled." : "Required for movie metadata.",
  });

  checks.push({
    name: "CRON_SECRET",
    category: "Operations",
    status: present("CRON_SECRET") ? "READY" : "MISSING",
    detail: present("CRON_SECRET") ? "Cron routes protected." : "Required for Vercel cron jobs.",
  });

  checks.push({
    name: "AI_ADMIN_SECRET",
    category: "Admin",
    status: present("AI_ADMIN_SECRET") ? "READY" : "MISSING",
    detail: present("AI_ADMIN_SECRET") ? "Admin API protected." : "Required for /admin product metrics.",
  });

  const ollama = present("OLLAMA_BASE_URL");
  checks.push({
    name: "OLLAMA_BASE_URL",
    category: "AI",
    status: ollama ? "READY" : "OPTIONAL",
    detail: ollama ? "Local Ollama configured." : "Optional local AI.",
  });

  const localAi = present("AI_LOCAL_ENDPOINT");
  checks.push({
    name: "AI_LOCAL_ENDPOINT",
    category: "AI",
    status: localAi ? "READY" : "OPTIONAL",
    detail: localAi ? "OpenAI-compatible local endpoint." : "Optional self-hosted AI.",
  });

  checks.push({
    name: "AI_LOCAL_API_KEY",
    category: "AI",
    status: present("AI_LOCAL_API_KEY") ? "READY" : "OPTIONAL",
    detail: "Optional key for local AI endpoint.",
  });

  const openai = present("OPENAI_API_KEY") || present("AI_OPENAI_API_KEY");
  checks.push({
    name: "OPENAI_API_KEY",
    category: "AI",
    status: openai ? "READY" : "OPTIONAL",
    detail: openai ? "Cloud AI configured." : "Optional cloud provider.",
  });

  checks.push({
    name: "NEXT_PUBLIC_SITE_URL",
    category: "Analytics",
    status: present("NEXT_PUBLIC_SITE_URL") ? "READY" : "OPTIONAL",
    detail: present("NEXT_PUBLIC_SITE_URL") ? "Canonical site URL set." : "Recommended for OG and sitemap.",
  });

  checks.push({
    name: "NEXT_PUBLIC_VERCEL_ANALYTICS",
    category: "Analytics",
    status: present("NEXT_PUBLIC_VERCEL_ANALYTICS") ? "READY" : "OPTIONAL",
    detail: "Optional Vercel Analytics bridge.",
  });

  const googleId = present("GOOGLE_CLIENT_ID");
  const googleSecret = present("GOOGLE_CLIENT_SECRET");
  checks.push({
    name: "GOOGLE_OAUTH",
    category: "Auth",
    status: googleId && googleSecret ? "READY" : googleId || googleSecret ? "INVALID" : "OPTIONAL",
    detail: googleId && googleSecret ? "Google OAuth configured." : "Optional social login.",
  });

  return checks;
}
