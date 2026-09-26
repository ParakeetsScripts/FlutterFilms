import { defineConfig } from "@playwright/test";
import { VIEWPORT_TESTS } from "./src/lib/design/breakpoints";

const routes = ["/", "/discover", "/copilot", "/my-cinema", "/watchlist", "/rooms", "/intelligence"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: VIEWPORT_TESTS.map((viewport) => ({
    name: viewport.name,
    use: { viewport: { width: viewport.width, height: viewport.height } },
  })),
  webServer: process.env.PLAYWRIGHT_SKIP_SERVER
    ? undefined
    : {
        command: "npm run start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  metadata: { routes },
});
