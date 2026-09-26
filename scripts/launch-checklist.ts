import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

type Item = { label: string; ok: boolean; detail: string };

function run(cmd: string): boolean {
  try {
    execSync(cmd, { cwd: root, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const isPostgres = process.env.DATABASE_URL?.startsWith("postgres") ?? false;
  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_URL);

  const items: Item[] = [
    { label: "Neon production", ok: isPostgres, detail: isPostgres ? "postgres DATABASE_URL" : "SQLite — not production" },
    { label: "TMDB configured", ok: Boolean(process.env.TMDB_API_KEY || process.env.TMDB_API_TOKEN), detail: "TMDB_API_KEY" },
    { label: "Production build", ok: run("npm run build"), detail: "npm run build" },
    { label: "Typecheck", ok: run("npm run typecheck"), detail: "tsc --noEmit" },
    { label: "Tests", ok: run("npm test"), detail: "vitest run" },
    { label: "DB verify", ok: run("npm run db:verify"), detail: "schema tables" },
    { label: "DB health", ok: run("npm run db:health"), detail: "connectivity" },
    { label: "PWA manifest", ok: existsSync(join(root, "src/app/manifest.ts")), detail: "manifest.ts" },
    { label: "PWA icons", ok: existsSync(join(root, "public/icons/icon-192.png")), detail: "icon-192.png" },
    { label: "Service worker", ok: existsSync(join(root, "public/sw.js")), detail: "sw.js" },
    { label: "Offline page", ok: existsSync(join(root, "src/app/offline/page.tsx")), detail: "/offline" },
    { label: "iOS project", ok: existsSync(join(root, "ios")), detail: "/ios" },
    { label: "Vercel deployed", ok: onVercel, detail: onVercel ? "VERCEL env set" : "Not on Vercel" },
    { label: "CRON_SECRET", ok: Boolean(process.env.CRON_SECRET), detail: "cron auth" },
    { label: "AI_ADMIN_SECRET", ok: Boolean(process.env.AI_ADMIN_SECRET), detail: "admin auth" },
  ];

  console.log("# FlutterFilms by Ritvik M — Launch Checklist\n");
  for (const item of items) {
    console.log(`[${item.ok ? "x" : " "}] ${item.label} — ${item.detail}`);
  }
  const passed = items.filter((i) => i.ok).length;
  console.log(`\n${passed}/${items.length} checks passed`);
  if (!items.every((i) => i.ok)) process.exit(1);
}

main();
