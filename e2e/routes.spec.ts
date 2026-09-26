import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/movies",
  "/discover",
  "/tonight",
  "/onboarding",
  "/my-cinema",
  "/watchlist",
  "/watchlists",
  "/rooms",
  "/copilot",
  "/people",
  "/franchises",
  "/genres",
  "/languages",
  "/images",
  "/videos",
  "/intelligence",
  "/intelligence/discover",
  "/intelligence/remember",
  "/community",
  "/search",
  "/settings",
  "/sources",
];

for (const route of ROUTES) {
  test(`route loads: ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
}
