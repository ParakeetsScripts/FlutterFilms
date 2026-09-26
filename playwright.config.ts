import { defineConfig } from "@playwright/test";
import { VIEWPORT_TESTS } from "./src/lib/design/breakpoints";

const routes = ["/", "/discover", "/copilot", "/my-cinema", "/watchlist", "/rooms", "/intelligence"];
const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3001";
const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: VIEWPORT_TESTS.map((viewport) => ({
    name: viewport.name,
    use: { viewport: { width: viewport.width, height: viewport.height } },
  })),
  webServer: process.env.PLAYWRIGHT_SKIP_SERVER
    ? undefined
    : {
        command: `PORT=${e2ePort} PLAYWRIGHT=1 npm run start`,
        url: e2eBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  metadata: { routes },
});
